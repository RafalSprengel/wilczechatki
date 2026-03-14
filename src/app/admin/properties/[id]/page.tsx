import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { getPropertyById } from '@/actions/adminPropertyActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import EditPropertyForm from './EditPropertyForm';

export default async function PropertyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  
  if (!property) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/admin/properties" className={styles.backButton}>
            ← Powrót do listy domków
          </Link>
          <h1>Edytuj domek: {property.name}</h1>
        </div>
        <p>Wprowadź zmiany w danych obiektu.</p>
      </header>

      <EditPropertyForm property={property} propertyId={id} />
    </div>
  );
}