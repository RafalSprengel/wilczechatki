'use client'
import { useState } from 'react'
import './page.css'

export default function AdminRegisterPage() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')

const handleSignUp = () => {
    // Logika rejestracji admina
}

const handleSignIn = () => {
    // Logika logowania admina
}

    return (
        <div className="auth-container">
            <h2>Rejestracja admina</h2>
            <input
                type="email"
                placeholder="Email"
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
                <button onClick={handleSignUp}>Zarejestruj się</button>
                <button onClick={handleSignIn}>Zaloguj się</button>
            </div>
        </div>
    )
}