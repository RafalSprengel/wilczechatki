import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import mongoose from "mongoose";
import dbConnect from "@/db/connection";

let _auth: ReturnType<typeof betterAuth> | undefined;

export async function getAuth() {
    if (_auth) return _auth;

    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection.db nie jest dostępne po dbConnect()");

    _auth = betterAuth({
        database: mongodbAdapter(db),

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 5,
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

    return _auth;
}