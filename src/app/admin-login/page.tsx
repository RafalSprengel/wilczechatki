'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import styles from './login.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const { error: signInError } = await (authClient.signIn as any).username({
                username,
                password,
                callbackURL: '/admin',
            });
            if (signInError) {
                if (
                    signInError.message === 'Invalid username' ||
                    signInError.message === 'Invalid username or password' ||
                    signInError.message === 'Invalid email or password'
                ) {
                    setError('Błędny login lub hasło');
                    return;
                }

                setError(signInError.message);
                return;
            }
            router.push('/admin');
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <h1 className={styles.title}>Panel Admina</h1>
                <p className={styles.subtitle}>Zaloguj się, aby kontynuować</p>

                {error && <p className={styles.error}>{error}</p>}

                <label className={styles.label} htmlFor="username">
                    Login
                </label>
                <input
                    id="username"
                    className={styles.input}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    placeholder="Wpisz login"
                />

                <label className={styles.label} htmlFor="password">
                    Hasło
                </label>
                <input
                    id="password"
                    className={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    placeholder="Wpisz hasło"
                />

                <button className={styles.button} type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <span className={styles.loadingWrapper}>
                            <span className={styles.spinner} />
                            Logowanie...
                        </span>
                    ) : (
                        'Zaloguj się'
                    )}
                </button>
            </form>
        </div>
    );
}