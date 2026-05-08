"use server";

import { getAuth } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";
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
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Przypomnienie loginu</h2>
                    <p>Witaj,</p>
                    <p>Otrzymaliśmy prośbę o przypomnienie loginu do panelu administratora.</p>
                    <p>Twój login to: <strong>${userDoc.username}</strong></p>
                    <p>Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość.</p>
                </div>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("Błąd podczas wysyłania przypomnienia loginu:", error);
        return { success: false, error: "Wystąpił nieoczekiwany błąd" };
    }
}
