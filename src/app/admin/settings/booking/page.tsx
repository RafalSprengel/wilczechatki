import { getBookingConfig } from '@/actions/bookingConfigActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import BookingSettingsForm from './BookingSettingsForm';
import styles from './booking.module.css';

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();
  return (
    <div className={styles.adminSettingsContainer}>
      <FloatingBackButton />
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Ustawienia rezerwacji</h1>
        <p className={styles.adminSubtitle}>Zarządzaj globalnymi zasadami rezerwacji.</p>
      </header>
      <BookingSettingsForm initialConfig={config} />
    </div>
  );
}