"use server";

import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";
import mongoose from "mongoose";
import { UsernameReminder } from "@/emails/UsernameReminder";

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

export async function requestUsernameReminderByEmail(email: string) {
    try {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            return { success: false, error: "Podaj adres e-mail" };
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            console.error("Brak połączenia z bazą danych MongoDB w akcji przypomnienia loginu.");
            return { success: false, error: "Błąd serwera" };
        }

        const userDoc = await db.collection("user").findOne({ email: normalizedEmail });

        if (!userDoc?.username) {
            return { success: true };
        }

        await sendEmail({
            to: normalizedEmail,
            subject: "Przypomnienie loginu - Wilcze Chatki",
            react: UsernameReminder({ username: userDoc.username }),
        });

        return { success: true };
    } catch (error) {
        console.error("Błąd podczas wysyłania przypomnienia loginu:", error);
        return { success: false, error: "Wystąpił nieoczekiwany błąd" };
    }
}
