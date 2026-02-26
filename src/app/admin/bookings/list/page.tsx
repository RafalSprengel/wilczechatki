import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Link from 'next/link';
import styles from './page.module.css';

export default async function BookingsListPage() {
  const bookings = await getAdminBookingsList();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/admin" className={styles.backButton}>
            ← Powrót do Dashboardu
          </Link>
          <h1>Lista Rezerwacji</h1>
        </div>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
      </header>

      {bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak rezerwacji w systemie.</p>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {bookings.map((booking) => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
            const statusLabel =
              booking.status === 'confirmed' ? 'Potwierdzona' :
              booking.status === 'blocked' ? 'Zablokowana' :
              booking.status === 'cancelled' ? 'Anulowana' : 'Oczekująca';

            return (
              <article key={booking._id} className={styles.bookingCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.guestName}>{booking.guestName || 'Gość'}</h3>
                  {booking.bookingType === 'shadow' && (
                    <span className={`${styles.badge} ${styles.badgeShadow}`}>Blokada systemowa</span>
                  )}
                </div>

                <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>

                <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Rezerwacja:</span>
                    <span className={styles.value}>
                      {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Nocy:</span>
                    <span className={styles.value}>{nights}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Cena:</span>
                    <span className={`${styles.value} ${styles.priceValue}`}>
                      {booking.totalPrice.toFixed(2)} zł
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>
                    {statusLabel}
                  </span>
                  <span className={styles.addedDate}>
                    dodano: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <Link
                  href={`/admin/bookings/list/${booking._id}`}
                  className={styles.editBtn}
                >
                  Edytuj
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}