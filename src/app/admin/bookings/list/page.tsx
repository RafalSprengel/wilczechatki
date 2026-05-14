import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Button from '@/app/_components/UI/Button/Button';
import Link from 'next/link';
import styles from './page.module.css';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import BookingSearch from './BookingSearch';

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
  searchParams?: Promise<{ q?: string; status?: string }>;
}

export default async function BookingsListPage({ searchParams }: BookingsListPageProps) {
  const bookings = await getAdminBookingsList();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const orderQuery = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q.trim() : '';
  const statusFilter = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : 'confirmed';
  const normalizedOrderQuery = orderQuery.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = bookings.filter((booking: any) => {
    let matchStatus = false;
    if (statusFilter === 'confirmed') {
      matchStatus = ['confirmed', 'blocked'].includes(booking.status);
    } else if (statusFilter === 'pending') {
      matchStatus = booking.status === 'pending';
    } else if (statusFilter === 'rejected') {
      matchStatus = ['failed', 'cancelled'].includes(booking.status);
    } else {
      matchStatus = true; // all
    }

    let matchSearch = true;
    if (normalizedOrderQuery.length > 0) {
      const q = normalizedOrderQuery;
      matchSearch =
        (typeof booking.orderId === 'string' && booking.orderId.toLowerCase().includes(q)) ||
        (typeof booking.guestName === 'string' && booking.guestName.toLowerCase().includes(q)) ||
        (typeof booking.guestEmail === 'string' && booking.guestEmail.toLowerCase().includes(q));
    }

    return matchStatus && matchSearch;
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
        <div className={styles.filtersWrap}>
          <div className={styles.filters} role="navigation" aria-label="Filtr statusu">
            <Link
              href={`/admin/bookings/list?status=confirmed${orderQuery ? `&q=${orderQuery}` : ''}`}
              className={`${styles.filterBtn} ${statusFilter === 'confirmed' ? styles.filterBtnConfirmedActive : ''}`}
            >
              Potwierdzone
            </Link>
            <Link
              href={`/admin/bookings/list?status=rejected${orderQuery ? `&q=${orderQuery}` : ''}`}
              className={`${styles.filterBtn} ${statusFilter === 'rejected' ? styles.filterBtnFailedActive : ''}`}
            >
              Odrzucone
            </Link>
            <Link
              href={`/admin/bookings/list?status=pending${orderQuery ? `&q=${orderQuery}` : ''}`}
              className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.filterBtnPendingActive : ''}`}
            >
              Oczekujące
            </Link>
            <Link
              href={`/admin/bookings/list?status=all${orderQuery ? `&q=${orderQuery}` : ''}`}
              className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterBtnActive : ''}`}
            >
              Wszystkie
            </Link>
          </div>

          <BookingSearch defaultValue={orderQuery} />
        </div>
      </header>

      {filteredBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{orderQuery.length > 0 ? 'Brak rezerwacji dla podanej frazy.' : 'Brak rezerwacji w systemie.'}</p>
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
                      <span className={styles.label}>Zamówienie nr:</span>
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
                          <span className={styles.label}>Status płatności:</span>
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
                      <Button variant='secondary' href={`/admin/bookings/list/${booking._id}`} className={styles.editBtn}>Edytuj</Button>
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