import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import { getAllSeasons } from '@/actions/seasonActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import PriceSettingsForm from './PriceSettingsForm';
import '../settings/settings.css';

export default async function PricesPage() {
  const [properties, bookingConfig, seasons] = await Promise.all([
    getAllProperties(),
    getBookingConfig(),
    getAllSeasons()
  ]);

  const singleProperties = properties.filter(p => p.type === 'single');
  const childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13;

  const serializedProperties = JSON.parse(JSON.stringify(singleProperties));
  const serializedSeasons = JSON.parse(JSON.stringify(seasons));

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Zarządzanie cenami</h1>
        <p className="admin-subtitle">Konfiguruj stawki podstawowe, w sezonie wysokim oraz ceny indywidualne</p>
      </header>
      <PriceSettingsForm
        properties={serializedProperties}
        childrenFreeAgeLimit={childrenFreeAge}
        seasons={serializedSeasons}
      />
    </div>
  );
}