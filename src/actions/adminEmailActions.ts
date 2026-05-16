"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";

export async function changeAdminEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = newEmail.trim().toLowerCase();

    if (!trimmed) {
        return { success: false, error: "Adres e-mail nie może być pusty." };
    }

    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return { success: false, error: "Brak aktywnej sesji." };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            return { success: false, error: "Błąd połączenia z bazą danych." };
        }

        const existing = await db.collection("user").findOne({ email: trimmed });
        if (existing && existing._id.toString() !== session.user.id) {
            return { success: false, error: "Ten adres e-mail jest już zajęty." };
        }

        const { ObjectId } = mongoose.Types;
        await db.collection("user").updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { email: trimmed, updatedAt: new Date() } }
        );

        return { success: true };
    } catch (error) {
        console.error("[changeAdminEmail] błąd:", error);
        return { success: false, error: "Wystąpił nieoczekiwany błąd." };
    }
}
