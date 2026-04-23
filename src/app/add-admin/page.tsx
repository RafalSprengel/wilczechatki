"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function AddAdminPage() {
    const [status, setStatus] = useState("Inicjowanie tworzenia admina...");

    useEffect(() => {
        const createAdmin = async () => {
            try {
                const { data, error } = await authClient.signUp.email({
                    email: "admin@twojadomena.pl",
                    password: "TwojeBardzoMocneHaslo2026!",
                    name: "Rafał",
                    role: "admin", // To pole zostanie zapisane dzięki Twojej konfiguracji w auth.js
                    callbackURL: "/dashboard"
                });

                if (error) {
                    setStatus(`Błąd: ${error.message}`);
                } else {
                    setStatus("Admin stworzony pomyślnie! Możesz teraz usunąć ten plik.");
                }
            } catch (err) {
                setStatus("Wystąpił nieoczekiwany błąd.");
                console.error(err);
            }
        };

        createAdmin();
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1>Generator Administratora</h1>
            <p>{status}</p>
        </div>
    );
}