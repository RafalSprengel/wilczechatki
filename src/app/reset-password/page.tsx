'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import styles from './reset.module.css';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('Brak tokenu resetującego. Upewnij się, że używasz poprawnego linku z e-maila.');
            return;
        }

        if (newPassword.length < 5) {
            setError('Hasło musi mieć co najmniej 5 znaków.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Hasła nie są identyczne.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: resetError } = await authClient.resetPassword({
                newPassword,
                token
            });

            if (resetError) {
                setError(resetError.message || 'Wystąpił błąd podczas resetowania hasła.');
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/admin-login');
                }, 3000);
            }
        } catch (err) {
            setError('Coś poszło nie tak. Spróbuj ponownie.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles['reset-page']}>
                <div className={styles['reset-page__form']}>
                    <h1 className={styles['reset-page__title']}>Sukces!</h1>
                    <p className={styles['reset-page__success']}>
                        Twoje hasło zostało zmienione. Za chwilę zostaniesz przekierowany do strony logowania.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['reset-page']}>
            <form className={styles['reset-page__form']} onSubmit={handleSubmit} noValidate>
                <h1 className={styles['reset-page__title']}>Nowe Hasło</h1>
                <p className={styles['reset-page__subtitle']}>Wprowadź swoje nowe hasło poniżej</p>

                {error && <p className={styles['reset-page__error']}>{error}</p>}

                <div className={styles['reset-page__field']}>
                    <label className={styles['reset-page__label']} htmlFor="newPassword">
                        Nowe hasło
                    </label>
                    <input
                        id="newPassword"
                        className={styles['reset-page__input']}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="Wpisz nowe hasło"
                    />
                </div>

                <div className={styles['reset-page__field']}>
                    <label className={styles['reset-page__label']} htmlFor="confirmPassword">
                        Potwierdź nowe hasło
                    </label>
                    <input
                        id="confirmPassword"
                        className={styles['reset-page__input']}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="Powtórz nowe hasło"
                    />
                </div>

                <button className={styles['reset-page__button']} type="submit" disabled={isLoading}>
                    {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className={styles['reset-page']}><div className={styles['reset-page__title']}>Ładowanie...</div></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
