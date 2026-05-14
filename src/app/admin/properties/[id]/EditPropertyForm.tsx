"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProperty, updateProperty } from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

export default function EditPropertyForm({
  property,
  propertyId,
}: {
  property: any;
  propertyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isActive, setIsActive] = useState(property.isActive);

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProperty(propertyId, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Zapisano zmiany!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  };

  const handleDelete = async () => {
    if (
      !confirm("Czy na pewno usunąć ten domek? Ta operacja jest nieodwracalna.")
    )
      return;
    setIsDeleting(true);
    const result = await deleteProperty(propertyId);
    if (result.success) {
      router.push("/admin/properties");
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.message });
      setIsDeleting(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsActive(e.target.checked);
  };

  return (
    <>
      {message && (
        <div
          className={`${styles.alert} ${message.type === "success" ? styles.alertSuccess : styles.alertError}`}
        >
          {message.text}
        </div>
      )}

      <form action={handleUpdate} className={styles.formCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Podstawowe informacje</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Nazwa domku *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={property.name}
                placeholder="np. Chatka A (Wilcza)"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="slug">Slug (URL)</label>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={property.slug || ""}
                placeholder="chatka-a"
                pattern="[a-z0-9\-]+"
                title="Tylko małe litery, cyfry i myślniki"
              />
              <small className={styles.hint}>Opcjonalne, np. chatka-a.</small>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="description">Opis</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={property.description || ""}
              placeholder="Krótki opis domku dla gości..."
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pojemność</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="maxAdults">Max. dorosłych *</label>
              <input
                id="maxAdults"
                name="maxAdults"
                type="number"
                min="1"
                max="30"
                required
                defaultValue={property.maxAdults}
              />
              <small className={styles.hint}>
                Maksymalna liczba dorosłych gości.
              </small>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="maxChildren">Max. dzieci *</label>
              <input
                id="maxChildren"
                name="maxChildren"
                type="number"
                min="0"
                max="30"
                required
                defaultValue={property.maxChildren}
              />
              <small className={styles.hint}>Maksymalna liczba dzieci.</small>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="maxExtraBeds">Maksymalna liczba dostawek *</label>
              <input
                id="maxExtraBeds"
                name="maxExtraBeds"
                type="number"
                min="0"
                max="10"
                required
                defaultValue={property.maxExtraBeds}
              />
              <small className={styles.hint}>
                Ile dodatkowych łóżek można dostawić.
              </small>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Zdjęcia</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="images">URL-e zdjęć (oddzielone przecinkiem)</label>
            <textarea
              id="images"
              name="images"
              rows={3}
              defaultValue={property.images?.join(", ") || ""}
              placeholder="/images/chatka-1.jpg, /images/chatka-2.jpg"
            />
            <small className={styles.hint}>
              Wklej ścieżki do zdjęć, oddzielając je przecinkami.
            </small>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Status</h2>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                name="isActive"
                value="true"
                checked={isActive}
                onChange={handleStatusChange}
              />
              <span
                className={`${styles.toggleText} ${isActive ? styles.active : styles.inactive}`}
              >
                {isActive
                  ? "Aktywny – widoczny w wyszukiwarce"
                  : "Nieaktywny – ukryty przed gośćmi"}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <Button href="/admin/properties" variant="secondary">
            Anuluj
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "⏳ Zapisywanie..." : "💾 Zapisz zmiany"}
          </Button>
        </div>
      </form>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Strefa niebezpieczna</h3>
        <p className={styles.dangerDesc}>
          Usunięcie domku jest nieodwracalne. Można usunąć tylko obiekty bez
          rezerwacji.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "⏳ Usuwanie..." : "🗑️ Usuń domek"}
        </Button>
      </div>
    </>
  );
}
