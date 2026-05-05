import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";

function createAuth(db: NonNullable<typeof mongoose.connection.db>) {
    return betterAuth({
        database: mongodbAdapter(db),

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 5,
            sendResetPassword: async ({ url, user }) => {
                await sendEmail({
                    to: user.email,
                    subject: "Reset hasła - Wilcze Chatki",
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2>Zresetuj swoje hasło</h2>
                            <p>Witaj,</p>
                            <p>Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta. Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #222; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Ustaw nowe hasło</a>
                            </p>
                            <p>Link jest ważny przez ograniczony czas.</p>
                            <p>Jeśli to nie Ty prosiłeś o reset hasła, po prostu zignoruj tę wiadomość.</p>
                        </div>
                    `
                });
            }
        },

        user: {
            additionalFields: {
                role: {
                    type: "string",
                    required: true,
                    defaultValue: "user",
                    input: true,
                },
                displayUsername: {
                    type: "string",
                    required: false,
                    input: true,
                }
            }
        },

        plugins: [
            username()
        ],

        secret: process.env.BETTER_AUTH_SECRET,
        trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
    });
}

type AppAuth = ReturnType<typeof createAuth>;
let _auth: AppAuth | undefined;

export async function getAuth(): Promise<AppAuth> {
    if (_auth) return _auth;

    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection.db nie jest dostępne po dbConnect()");

    _auth = createAuth(db);

    return _auth;
}
