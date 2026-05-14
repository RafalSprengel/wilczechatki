import { revalidatePath } from "next/cache";
import {
  getAllProperties,
  togglePropertyActive,
} from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import DeletePropertyButton from "./DeletePropertyButton";
import styles from "./page.module.css";

export default async function PropertiesPage() {
  const properties = await getAllProperties();

  async function handleToggleActive(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await togglePropertyActive(id, !isActive);
    revalidatePath("/admin/properties");
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Zarządzanie obiektami</h1>
        <p>Dodaj, edytuj lub dezaktywuj obiekty w systemie.</p>
        <Button href="/admin/properties/add" variant='secondary' className={styles.btnAdd}>
          ➕ Dodaj nowy obiekt
        </Button>
      </header>
      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak obiektów w systemie.</p>
          <Button href="/admin/properties/add"  variant='secondary' className={styles.btnAdd}>
            Dodaj pierwszy obiekt
          </Button>
        </div>
      ) : (
        <div className={styles.propertiesGrid}>
          {properties.map((prop) => (
            <article key={prop._id} className={styles.propertyCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.propertyName}>{prop.name}</h3>
                <span
                  className={`${styles.badge} ${prop.isActive ? styles.badgeActive : styles.badgeInactive}`}
                >
                  {prop.isActive ? "Aktywny" : "Nieaktywny"}
                </span>
              </div>
              {prop.description && (
                <p className={styles.description}>{prop.description}</p>
              )}
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dorosłych:</span>
                  <span className={styles.value}>{prop.maxAdults}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dzieci:</span>
                  <span className={styles.value}>{prop.maxChildren}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. dostawek:</span>
                  <span className={styles.value}>{prop.maxExtraBeds}</span>
                </div>
                {prop.slug && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Slug:</span>
                    <code className={styles.code}>{prop.slug}</code>
                  </div>
                )}
              </div>
              <div className={styles.cardActions}>
                <form action={handleToggleActive}>
                  <input type="hidden" name="id" value={prop._id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={String(prop.isActive)}
                  />
                  <Button type="submit" variant="secondary" fullWidth>
                    {prop.isActive ? "🔘 Dezaktywuj" : "✅ Aktywuj"}
                  </Button>
                </form>
                <div className={styles.cardActionsRow}>
                  <Button variant='secondary' href={`/admin/properties/${prop._id}`}>
                    ✏️ Edytuj
                  </Button>
                  <DeletePropertyButton
                    propertyId={prop._id}
                    propertyName={prop.name}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
