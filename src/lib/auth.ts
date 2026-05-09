import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import dbConnect from "@/db/connection";
import { sendEmail } from "@/lib/sendEmail";
import { PasswordReset } from "@/emails/PasswordReset";
import {Db} from "mongodb";

function createAuth(db: Db) {
    return betterAuth({
        database: mongodbAdapter(db),

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 5,
            sendResetPassword: async ({ url, user }) => {
                await sendEmail({
                    to: user.email,
                    subject: "Reset hasła - Wilcze Chatki",
                    react: PasswordReset({ url })
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
