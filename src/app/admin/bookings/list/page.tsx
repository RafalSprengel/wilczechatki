import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';

function getPaymentBadge(paymentStatus: string, paidAmount: number, totalPrice: number) {
  const isFullyPaidByAmount = totalPrice > 0 && paidAmount >= totalPrice;
  if (paymentStatus === 'paid' || isFullyPaidByAmount) return { text: 'Opłacone', class: styles.paymentPaid };
  if (paidAmount > 0) return { text: 'Zaliczka', class: styles.paymentDeposit };
  return { text: 'Nieopłacone', class: styles.paymentUnpaid };
}

function formatGuestName(name: string) {
  if (!name) return 'Gość';
  const trimmed = name.trim();
  // Jeśli tekst jest samymi dużymi lub samymi małymi literami - poprawiamy.
  // Jeśli ma już mieszane wielkości liter, zostawiamy (ochrona nazwisk typu MacDonald).
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return trimmed;
}

interface BookingsListPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function BookingsListPage({ searchParams }: BookingsListPageProps) {
  const bookings = await getAdminBookingsList();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const orderQuery = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q.trim() : '';
  const normalizedOrderQuery = orderQuery.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = normalizedOrderQuery.length === 0
    ? bookings
    : bookings.filter((booking: any) => {
      if (typeof booking.orderId !== 'string') {
        return false;
      }

      return booking.orderId.toLowerCase().includes(normalizedOrderQuery);
    });

  const upcomingBookings = filteredBookings
    .filter((b: any) => new Date(b.endDate) >= today)
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastBookings = filteredBookings
    .filter((b: any) => new Date(b.endDate) < today)
    .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <FloatingBackButton />
          <h1>Lista rezerwacji</h1>
        </div>
        <p>Przeglądaj, edytuj lub usuwaj istniejące rezerwacje.</p>
        <form method="get" className={styles.searchForm}>
          <input
            type="text"
            name="q"
            defaultValue={orderQuery}
            placeholder="Szukaj po numerze zamówienia, np. ORD-000123"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>Szukaj</button>
          {orderQuery.length > 0 ? <Link href="/admin/bookings/list" className={styles.clearSearch}>Wyczyść</Link> : null}
        </form>
      </header>

      {filteredBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{orderQuery.length > 0 ? 'Brak rezerwacji dla podanego numeru zamówienia.' : 'Brak rezerwacji w systemie.'}</p>
        </div>
      ) : (
        <>
          {upcomingBookings.length > 0 && (
            <div className={styles.cardsList}>
              {upcomingBookings.map((booking: any) => {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                const statusLabel = booking.status === 'confirmed'
                  ? 'Potwierdzona'
                  : booking.status === 'blocked'
                    ? 'Zablokowana'
                    : booking.status === 'cancelled'
                      ? 'Anulowana'
                      : booking.status === 'failed'
                        ? 'Odrzucona'
                        : 'Oczekująca';
                const paidAmount = Number(booking.paidAmount);
                const totalPrice = Number(booking.totalPrice);
                const remainingAmount = totalPrice - paidAmount;
                const paymentBadge = getPaymentBadge(booking.paymentStatus, paidAmount, totalPrice);
                const isFullyPaid = booking.paymentStatus === 'paid' || (totalPrice > 0 && paidAmount >= totalPrice);

                return (
                  <article key={booking._id} className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <span className={styles.dateLabel}>Rezerwacja:</span>
                      <span className={styles.dateValue}>
                        {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <h3 className={styles.guestName}>{formatGuestName(booking.guestName)}</h3>
                    <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
                    <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Zamówienie nr.:</span>
                      <span className={styles.value}>{booking.orderId ? booking.orderId : 'Brak numeru'}</span>
                    </div>


                    <div className={styles.detailsGrid}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Ilość nocy:</span>
                        <span className={styles.value}>{nights}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Dorośli (bezpłatnie):</span>
                        <span className={styles.value}>{booking.adults}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Dzieci:</span>
                        <span className={styles.value}>{booking.children}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Dostawki:</span>
                        <span className={styles.value}>{booking.extraBedsCount}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Cena:</span>
                        <span className={styles.value}>{booking.totalPrice.toFixed(2)} zł</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Rodzaj płatności:</span>
                        <span className={styles.value}>{booking.paymentMethod === 'online' ? 'Online' : booking.paymentMethod === 'cash' ? 'Gotówka' : booking.paymentMethod === 'transfer' ? 'Przelew' : booking.paymentMethod}</span>
                      </div>
                      {isFullyPaid ? (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Płatność:</span>
                          <span className={`${styles.value} ${styles.paymentPaid}`}>Opłacono</span>
                        </div>
                      ) : (
                        <>
                          <div className={styles.detailRow}>
                            <span className={styles.label}></span>
                            <div className={styles.priceBreakdown}>
                              <span className={styles.pricePaid}>Wpłacono: {paidAmount.toFixed(2)} zł</span>
                              <span className={styles.priceDue}>Do zapłaty: {remainingAmount.toFixed(2)} zł</span>
                            </div>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.label}>Płatność:</span>
                            <span className={`${styles.value} ${paymentBadge.class}`}>
                              {paymentBadge.text}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>{statusLabel}</span>
                      <span className={styles.addedDate}>dodano: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}</span>
                      <Link href={`/admin/bookings/list/${booking._id}`} className={styles.editBtn}>Edytuj</Link>
                    </div>
                    {booking.source === 'admin' && (
                      <div className={styles.adminBubble}>Rezerwacja dokonana przez panel admina</div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {upcomingBookings.length > 0 && pastBookings.length > 0 && (
            <div className={styles.pastDivider}>Przeszłe rezerwacje</div>
          )}

          {pastBookings.length > 0 && (
            <div className={styles.cardsList}>
              {pastBookings.map((booking: any) => {
                const start = new Date(booking.startDate);
                const end = new Date(booking.endDate);
                const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const statusKey = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
                const statusLabel = booking.status === 'confirmed'
                  ? 'Potwierdzona'
                  : booking.status === 'blocked'
                    ? 'Zablokowana'
                    : booking.status === 'cancelled'
                      ? 'Anulowana'
                      : booking.status === 'failed'
                        ? 'Odrzucona'
                        : 'Oczekująca';
                const paidAmount = Number(booking.paidAmount);
                const totalPrice = Number(booking.totalPrice);
                const remainingAmount = totalPrice - paidAmount;
                const paymentBadge = getPaymentBadge(booking.paymentStatus, paidAmount, totalPrice);
                const isFullyPaid = booking.paymentStatus === 'paid' || (totalPrice > 0 && paidAmount >= totalPrice);

                return (
                  <article key={booking._id} className={`${styles.bookingCard} ${styles.pastCard}`}>
                    <div className={styles.bookingHeader}>
                      <span className={styles.dateLabel}>Rezerwacja:</span>
                      <span className={styles.dateValue}>
                        {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <h3 className={styles.guestName}>{booking.guestName || 'Gość'}</h3>
                    <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
                    <div className={styles.propertyName}>{booking.propertyName || 'Domek'}</div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Zamówienie nr.:</span>
                      <span className={styles.value}>{booking.orderId ? booking.orderId : 'Brak numeru'}</span>
                    </div>

                    <div className={styles.detailsGrid}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Nocy:</span>
                        <span className={styles.value}>{nights}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Cena:</span>
                        <span className={styles.value}>{booking.totalPrice.toFixed(2)} zł</span>
                      </div>
                      {isFullyPaid ? (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Płatność:</span>
                          <span className={`${styles.value} ${styles.paymentPaid}`}>Opłacono</span>
                        </div>
                      ) : (
                        <>
                          <div className={styles.detailRow}>
                            <span className={styles.label}></span>
                            <div className={styles.priceBreakdown}>
                              <span className={styles.pricePaid}>Wpłacono: {paidAmount.toFixed(2)} zł</span>
                              <span className={styles.priceDue}>Do zapłaty: {remainingAmount.toFixed(2)} zł</span>
                            </div>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.label}>Płatność:</span>
                            <span className={`${styles.value} ${paymentBadge.class}`}>
                              {paymentBadge.text}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={`${styles.badge} ${styles[`badge${statusKey}`]} ${styles.badgePast}`}>{statusLabel}</span>
                      <span className={styles.addedDate}>dodano: {new Date(booking.createdAt).toLocaleDateString('pl-PL')}</span>
                      <span className={styles.editBtnDisabled}>Edytuj</span>
                    </div>
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