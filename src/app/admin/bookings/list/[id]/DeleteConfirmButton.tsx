"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    if (!confirm("Czy na pewno usunąć tę rezerwację?")) return;
    setIsDeleting(true);
    const result = await deleteBookingAction(bookingId);
    if (result.success) {
      router.push("/admin/bookings/list");
      router.refresh();
    } else {
      alert("Błąd: " + (result.message || "Nie udało się usunąć rezerwacji"));
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="danger"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "⏳ Usuwanie..." : "🗑️ Usuń Rezerwację"}
    </Button>
  );
}
