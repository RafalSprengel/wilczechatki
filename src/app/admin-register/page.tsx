"use client";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import "./page.css";

export default function AdminRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = () => {
    // Logika rejestracji admina
  };

  const handleSignIn = () => {
    // Logika logowania admina
  };

  return (
    <div className="auth-container">
      <h2>Rejestracja admina</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="buttons">
        <Button onClick={handleSignUp}>Zarejestruj się</Button>
        <Button variant="secondary" onClick={handleSignIn}>
          Zaloguj się
        </Button>
      </div>
    </div>
  );
}
