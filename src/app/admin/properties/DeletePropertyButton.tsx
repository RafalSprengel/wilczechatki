'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProperty } from "@/actions/adminPropertyActions";
import styles from "./page.module.css";

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyName: string;
}

export default function DeletePropertyButton({
  propertyId,
  propertyName,
}: DeletePropertyButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProperty(propertyId);
      router.refresh();
      setShowConfirm(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Wystąpił nieznany błąd.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowConfirm(true);
        }}
        className={styles.btnDelete}
      >
        🗑️ Usuń
      </button>

      {showConfirm && (
        <div className={styles.dialogOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Potwierdź usunięcie</h3>
            <p>
              Czy na pewno chcesz trwale usunąć domek "<b>{propertyName}</b>"?
              Tej operacji nie można cofnąć.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.confirmActions}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className={styles.btnCancel}
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                className={styles.btnDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Usuwanie..." : "Tak, usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
