"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/app/_components/Modal/Modal";
import { deleteBookingAction } from "@/actions/adminBookingActions";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

export default function DeleteConfirmButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBookingAction(bookingId);
    if (result.success) {
      router.push("/admin/bookings/list");
      router.refresh();
    } else {
      toast.error("Błąd: " + (result.message || "Nie udało się usunąć rezerwacji"));
      setIsDeleting(false);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  const confirmDelete = async () => {
    await handleDelete();
    closeConfirm();
  };

  return (
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
  );
}
