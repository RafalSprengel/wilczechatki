'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
    requestPasswordResetByUsername,
    requestUsernameReminderByEmail,
} from '@/actions/resetAdminPasswordAction';
import styles from './login.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [isUsernameReminderLoading, setIsUsernameReminderLoading] = useState(false);
    const [isForgotPasswordFieldVisible, setIsForgotPasswordFieldVisible] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');

    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleResetPassword = async () => {
        if (username.trim() === '') {
            setError('Najpierw wpisz login');
            setSuccessMsg(null);
            return;
        }
        setError(null);
        setSuccessMsg(null);
        
        if (isResetLoading) return;

        setIsResetLoading(true);
        try {
            const res = await requestPasswordResetByUsername(username);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccessMsg('Jeśli podany login istnieje, na powiązany e-mail został wysłany link do zmiany hasła.');
                setIsForgotPasswordFieldVisible(false);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas wysyłania linku.');
        } finally {
            setIsResetLoading(false);
        }
    }

    const handleUsernameReminder = async () => {
        if (recoveryEmail.trim() === '') {
            setError('Najpierw wpisz adres e-mail');
            setSuccessMsg(null);
            return;
        }
        setError(null);
        setSuccessMsg(null);

        if (isUsernameReminderLoading) return;

        setIsUsernameReminderLoading(true);
        try {
            const res = await requestUsernameReminderByEmail(recoveryEmail);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccessMsg('Jeśli podany adres e-mail istnieje, login został wysłany na powiązaną skrzynkę.');
                setIsForgotPasswordFieldVisible(false);
            }
        } catch (err) {
            setError('Wystąpił błąd podczas wysyłania loginu.');
        } finally {
            setIsUsernameReminderLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoggingIn) return;

        setError(null);
        setIsLoggingIn(true);
        try {
            const { error: signInError } = await authClient.signIn.username({
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

                setError(signInError.message || 'Wystąpił błąd podczas logowania');
                return;
            }
            router.push('/admin');
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
            console.error(err);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className={styles.page}>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <h1 className={styles.title}>Panel Admina</h1>
                <p className={styles.subtitle}>Zaloguj się, aby kontynuować</p>

                {error && <p className={styles.error}>{error}</p>}
                {successMsg && <p className={styles.success}>{successMsg}</p>}

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
                    disabled={isLoggingIn}
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
                    disabled={isLoggingIn}
                    placeholder="Wpisz hasło"
                />
                <div
                    onClick={() => setIsForgotPasswordFieldVisible(!isForgotPasswordFieldVisible)}
                    className={styles.forgotPassword}
                >
                    Nie pamiętam loginu lub hasła
                </div>
                {isForgotPasswordFieldVisible && (
                    <>
                        <div
                            onClick={handleResetPassword}
                            aria-disabled={isResetLoading}
                            className={styles.forgotPasswordInfo}>
                            {isResetLoading
                                ? 'Wysyłanie linku...'
                                : 'Kliknij tu, aby otrzymać link do zmiany hasła na e-mail powiązany z kontem'}
                        </div>
                        <input
                            id="recovery-email"
                            className={styles.input}
                            type="email"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            autoComplete="email"
                            placeholder="Wpisz adres e-mail powiązany z kontem"
                            disabled={isLoggingIn || isUsernameReminderLoading}
                        />
                        <div
                            onClick={handleUsernameReminder}
                            aria-disabled={isUsernameReminderLoading}
                            className={styles.forgotPasswordInfo}>
                            {isUsernameReminderLoading
                                ? 'Wysyłanie loginu...'
                                : 'Wyslij login na adres email powiazany z kontem'}
                        </div>
                    </>
                )}

                <button className={styles.button} type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
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