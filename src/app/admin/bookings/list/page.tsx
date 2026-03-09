import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

export default async function BookingsListPage() {
  const bookings = await getAdminBookingsList();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingBookings = bookings.filter((b: any) => new Date(b.endDate) >= today).sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const pastBookings = bookings.filter((b: any) => new Date(b.endDate) < today).sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Lista Rezerwacji</h1>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
      </header>
      {bookings.length === 0 ? (
        <div className={styles.emptyState}><p>Brak rezerwacji w systemie.</p></div>
      ) : (
        <>
          {upcomingBookings.length > 0 && (
            <div className={styles.cardsList}>
              {upcomingBookings.map((booking) => {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                const statusLabel = booking.status === 'confirmed' ? 'Potwierdzona' : booking.status === 'blocked' ? 'Zablokowana' : booking.status === 'cancelled' ? 'Anulowana' : 'Oczekująca';
                return (
                  <article key={booking._id} className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <span className={styles.dateLabel}>Rezerwacja:</span>
                      <span className={styles.dateValue}>{start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}</span>
                    </div>
                    <h3 className={styles.guestName}>{booking.guestName || 'Gość'}</h3>
                    <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
                    <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailRow}><span className={styles.label}>Nocy:</span><span className={styles.value}>{nights}</span></div>
                      <div className={styles.detailRow}><span className={styles.label}>Cena:</span><span className={`${styles.value} ${styles.priceValue}`}>{booking.totalPrice.toFixed(2)} zł</span></div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Płatność:</span>
                        <span className={`${styles.value} ${booking.paymentStatus === 'paid' ? styles.paymentPaid :
                            booking.paymentStatus === 'deposit' ? styles.paymentDeposit :
                              styles.paymentUnpaid
                          }`}>
                          {booking.paymentStatus === 'paid' ? 'Opłacone' :
                            booking.paymentStatus === 'deposit' ? 'Zaliczka' :
                              'Nieopłacone'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>{statusLabel}</span>
                      <span className={styles.addedDate}>dodano: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}</span>
                    </div>
                    <Link href={`/admin/bookings/list/${booking._id}`} className={styles.editBtn}>Edytuj</Link>
                  </article>
                );
              })}
            </div>
          )}
          {upcomingBookings.length > 0 && pastBookings.length > 0 && (<div className={styles.pastDivider}><span>Przeszłe rezerwacje</span></div>)}
          {pastBookings.length > 0 && (
            <div className={styles.cardsList}>
              {pastBookings.map((booking) => {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                const statusLabel = booking.status === 'confirmed' ? 'Potwierdzona' : booking.status === 'blocked' ? 'Zablokowana' : booking.status === 'cancelled' ? 'Anulowana' : 'Oczekująca';
                return (
                  <article key={booking._id} className={`${styles.bookingCard} ${styles.pastCard}`}>
                    <div className={styles.bookingHeader}>
                      <span className={styles.dateLabel}>Rezerwacja:</span>
                      <span className={styles.dateValue}>{start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}</span>
                    </div>
                    <h3 className={styles.guestName}>{booking.guestName || 'Gość'}</h3>
                    <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
                    <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailRow}><span className={styles.label}>Nocy:</span><span className={styles.value}>{nights}</span></div>
                      <div className={styles.detailRow}><span className={styles.label}>Cena:</span><span className={`${styles.value} ${styles.priceValue}`}>{booking.totalPrice.toFixed(2)} zł</span></div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={`${styles.badge} ${styles[`badge${statusKey}`]} ${styles.badgePast}`}>{statusLabel}</span>
                      <span className={styles.addedDate}>dodano: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}</span>
                    </div>
                    <span className={styles.editBtnDisabled}>Edytuj</span>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}