'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

async function deleteProperty(id: string) {
    const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete property');
    }
    return res.json();
}

export default function DeletePropertyButton({ propertyId }: { propertyId: string }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            await deleteProperty(propertyId);
            alert('Nieruchomość została usunięta.');
            router.push('/admin/properties');
            router.refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <button onClick={() => setShowConfirm(true)} className={styles.deleteButton} disabled={isDeleting}>
                Usuń Nieruchomość
            </button>
            {showConfirm && (
                <div className={styles.confirmDialog}>
                    <p>Czy na pewno chcesz usunąć tę nieruchomość?</p>
                    <button onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Usuwanie...' : 'Tak, usuń'}
                    </button>
                    <button onClick={() => setShowConfirm(false)} disabled={isDeleting}>Anuluj</button>
                    {error && <p className={styles.error}>{error}</p>}
                </div>
            )}
        </>
    );
}
