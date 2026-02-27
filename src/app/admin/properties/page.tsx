import Link from 'next/link';
import styles from './page.module.css';
import { getAllProperties, togglePropertyActive, deleteProperty } from '@/actions/adminPropertyActions';
import { revalidatePath } from 'next/cache';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import DeletePropertyButton from './DeletePropertyButton';

export default async function PropertiesPage() {
  const properties = await getAllProperties();

  async function handleToggleActive(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const isActive = formData.get('isActive') === 'true';
    await togglePropertyActive(id, !isActive);
    revalidatePath('/admin/properties');
  }

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteProperty(id);
    revalidatePath('/admin/properties');
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Zarządzanie domkami</h1>
        <p>Dodaj, edytuj lub dezaktywuj obiekty w systemie.</p>
        <Link href="/admin/properties/add" className={styles.btnAdd}>➕ Dodaj nowy domek</Link>
      </header>
      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak domków w systemie.</p>
          <Link href="/admin/properties/add" className={styles.btnAdd}>Dodaj pierwszy domek</Link>
        </div>
      ) : (
        <div className={styles.propertiesGrid}>
          {properties.map((prop) => (
            <article key={prop._id} className={styles.propertyCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.propertyName}>{prop.name}</h3>
                <span className={`${styles.badge} ${prop.isActive ? styles.badgeActive : styles.badgeInactive}`}>{prop.isActive ? 'Aktywny' : 'Nieaktywny'}</span>
              </div>
              {prop.description && (<p className={styles.description}>{prop.description}</p>)}
              <div className={styles.details}>
                <div className={styles.detailRow}><span className={styles.label}>Pojemność:</span><span className={styles.value}>{prop.baseCapacity}+{prop.maxCapacityWithExtra - prop.baseCapacity} os.</span></div>
                {prop.slug && (<div className={styles.detailRow}><span className={styles.label}>Slug:</span><code className={styles.code}>{prop.slug}</code></div>)}
              </div>
              <div className={styles.cardActions}>
                <form action={handleToggleActive}>
                  <input type="hidden" name="id" value={prop._id} />
                  <input type="hidden" name="isActive" value={String(prop.isActive)} />
                  <button type="submit" className={styles.btnToggle}>{prop.isActive ? '🔘 Dezaktywuj' : '✅ Aktywuj'}</button>
                </form>
                <Link href={`/admin/properties/${prop._id}`} className={styles.btnEdit}>✏️ Edytuj</Link>
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={prop._id} />
                  <DeletePropertyButton />
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}