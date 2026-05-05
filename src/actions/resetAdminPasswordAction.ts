"use server";

import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";

export async function requestPasswordResetByUsername(username: string) {
    try {
        if (!username || username.trim() === '') {
            return { success: false, error: "Brak loginu" };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            console.error("Brak połączenia z bazą danych MongoDB w akcji resetowania.");
            return { success: false, error: "Błąd serwera" };
        }

        const userDoc = await db.collection('user').findOne({ username: username });

        if (!userDoc || !userDoc.email) {
            return { success: false, error: 'Błędny login' };
        }

        const auth = await getAuth();
        if (!auth) {
            return { success: false, error: "Błąd serwera" };
        }

        await auth.api.requestPasswordReset({
            body: {
                email: userDoc.email,
                redirectTo: "/reset-password"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Błąd podczas resetowania hasła:", error);
        return { success: false, error: "Wystąpił nieoczekiwany błąd" };
    }
}
