import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

const db = mongoose.connection.db;

if (!db) {
    throw new Error("Mongoose connection is not initialized. Connect to MongoDB before creating Better Auth.");
}

export const auth = betterAuth({
    // Better Auth użyje Twojego istniejącego połączenia z MongoDB
    database: mongodbAdapter(db),
    
    emailAndPassword: {
        enabled: true,
        // Opcjonalnie możesz wymusić unikalność maili, choć Better Auth robi to domyślnie
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "user",
                // 'input: true' pozwala na przesłanie roli podczas rejestracji (np. z selecta)
                input: true, 
            }
        }
    },

    // Ważne dla bezpieczeństwa w Next.js
    secret: process.env.BETTER_AUTH_SECRET,
});