import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import { getPriceConfig } from '@/actions/priceConfigActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import PriceSettingsForm from './PriceSettingsForm';
import '../settings/settings.css';

export default async function PricesPage() {
  const [properties, bookingConfig, priceConfig] = await Promise.all([
    getAllProperties(),
    getBookingConfig(),
    getPriceConfig()
  ]);

  const singleProperties = properties.filter(p => p.type === 'single');

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Zarządzanie cenami</h1>
        <p className="admin-subtitle">Konfiguruj stawki podstawowe, w sezonie wysokim oraz ceny indywidualne</p>
      </header>
      <PriceSettingsForm 
        properties={singleProperties}
        childrenFreeAgeLimit={bookingConfig.childrenFreeAgeLimit}
        initialRates={priceConfig?.baseRates}
      />
    </div>
  );
}