"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

async function deleteProperty(id: string) {
  const res = await fetch(`/api/properties/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete property");
  }
  return res.json();
}

export default function DeletePropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await deleteProperty(propertyId);
      alert("Nieruchomość została usunięta.");
      router.push("/admin/properties");
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
      <Button
        variant="danger"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        Usuń Nieruchomość
      </Button>
      {showConfirm && (
        <div className={styles.confirmDialog}>
          <p>Czy na pewno chcesz usunąć tę nieruchomość?</p>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Usuwanie..." : "Tak, usuń"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </>
  );
}
