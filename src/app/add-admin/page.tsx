"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function AddAdminPage() {
    const [status, setStatus] = useState("Inicjowanie tworzenia admina...");

    useEffect(() => {
        const createAdmin = async () => {
            try {
                const { data, error } = await authClient.signUp.email({
                    email: "admin@admin.pl",
                    password: "admin",
                    name: "Rafał",
                    role: "admin", // To pole zostanie zapisane dzięki Twojej konfiguracji w auth.ts
                    callbackURL: "/admin"
                } as any);

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
        <div className={styles.container}>
            <h1 className={styles.title}>Generator Administratora</h1>
            <p>{status}</p>
        </div>
    );
}
