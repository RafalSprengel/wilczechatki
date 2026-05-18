"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Button from "@/app/_components/UI/Button/Button";
import Modal from "@/app/_components/Modal/Modal";
import styles from "./page.module.css";
export default function BookingDetailsContent({
  booking,
  onDelete,
}: {
  booking: any;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Rezerwacja została usunięta.");
      router.push("/admin/bookings/list");
      router.refresh();
    } catch {
      toast.error("Wystąpił błąd podczas usuwania.");
      setIsDeleting(false);
    }
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);
  const confirmDelete = async () => {
    await handleDelete();
    closeConfirm();
  };
  return (
    <>
      {/* errors shown via toast */}
      <div className={styles.infoBlock}>
        <h3 className={styles.cardTitle}>Podsumowanie</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>ID:</span>
          <code className={styles.code}>{booking._id}</code>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Utworzono:</span>
          <span>{new Date(booking.createdAt).toLocaleString("pl-PL")}</span>
        </div>
      </div>
      <div className={styles.actionsBlock}>
        <h3 className={styles.cardTitle}>Strefa niebezpieczna</h3>
        <>
          <Button
            type="button"
            variant="danger"
            onClick={openConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "⏳ Usuwanie..." : "🗑️ Usuń Rezerwację"}
          </Button>
          <Modal
            isOpen={showConfirm}
            onClose={closeConfirm}
            onConfirm={confirmDelete}
            title={"Usuń rezerwację"}
            confirmText={"Usuń"}
            cancelText={"Anuluj"}
            confirmVariant="danger"
            isLoading={isDeleting}
          >
            <p>Czy na pewno usunąć tę rezerwację? Tej operacji nie można cofnąć.</p>
          </Modal>
        </>
        <p className={styles.deleteHint}>
          Usunięcie rezerwacji zwolni termin w kalendarzu.
        </p>
      </div>
    </>
  );
}
