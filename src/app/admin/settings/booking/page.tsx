import { getBookingConfig } from '@/actions/bookingConfigActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import BookingSettingsForm from './BookingSettingsForm';

export default async function BookingSettingsPage() {
  const config  = await getBookingConfig();

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Ustawienia rezerwacji</h1>
        <p className="admin-subtitle">Zarządzaj globalnymi zasadami rezerwacji</p>
      </header>
      <BookingSettingsForm initialConfig={config} />
    </div>
  );
}