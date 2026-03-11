import { getBookingById } from '@/actions/adminBookingActions';
import { notFound } from 'next/navigation';
import EditBookingForm from './EditBookingForm';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import DeleteConfirmButton from './DeleteConfirmButton';

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) { notFound(); }

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Szczegóły Rezerwacji</h1>
      </header>
      <div className={styles.grid}>
        <div className={styles.mainCard}>
          <h2 className={styles.cardTitle}>Edycja Danych</h2>
          <EditBookingForm initialData={booking} />
        </div>
        <div className={styles.sideCard}>
          <div className={styles.infoBlock}>
            <h3 className={styles.cardTitle}>Podsumowanie</h3>
            <div className={styles.infoRow}><span className={styles.label}>ID:</span><code className={styles.code}>{booking._id}</code></div>
            <div className={styles.infoRow}><span className={styles.label}>Utworzono:</span><span>{new Date(booking.createdAt).toLocaleString('pl-PL')}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Typ:</span><span className={styles.value}>{booking.bookingType === 'shadow' ? 'Blokada systemowa' : 'Rezerwacja gościa'}</span></div>
          </div>
          {booking.bookingType === 'real' && (
            <div className={styles.actionsBlock}>
              <h3 className={styles.cardTitle}>Strefa niebezpieczna</h3>
              <DeleteConfirmButton bookingId={booking._id} />
              <p className={styles.deleteHint}>Usunięcie rezerwacji zwolni termin w kalendarzu.</p>
            </div>
          )}
          {booking.bookingType === 'shadow' && (<div className={styles.warningBox}>⚠️ Jest to blokada systemowa (Shadow Booking).<br />Aby zwolnić ten termin, usuń powiązaną rezerwację główną.</div>)}
        </div>
      </div>
    </div>
  );
}