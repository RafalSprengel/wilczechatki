"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Button from "@/app/_components/UI/Button/Button";
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
  
  const handleDelete = async () => {
    if (!confirm("Czy na pewno usunąć tę rezerwację?")) return;
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
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "⏳ Usuwanie..." : "🗑️ Usuń Rezerwację"}
        </Button>
        <p className={styles.deleteHint}>
          Usunięcie rezerwacji zwolni termin w kalendarzu.
        </p>
      </div>
    </>
  );
}
