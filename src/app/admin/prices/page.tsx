import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import { getAllSeasons } from '@/actions/seasonActions';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import PriceSettingsForm from './PriceSettingsForm';
import '../settings/settings.css';
import styles from './page.module.scss';

export default async function PricesPage() {
  const [properties, bookingConfig, seasons] = await Promise.all([
    getAllProperties(),
    getBookingConfig(),
    getAllSeasons()
  ]);

  const childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13;

  const serializedProperties = JSON.parse(JSON.stringify(properties));
  const serializedSeasons = JSON.parse(JSON.stringify(seasons));

  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Zarządzanie cenami</h1>
        <p className="admin-subtitle">Konfiguruj stawki podstawowe, stawki w sezonach oraz ceny indywidualne.</p>
      </header>

      <div className={styles['price-priority-info']}>
        <div className={styles['price-priority-info__icon']}>i</div>
        <div className={styles['price-priority-info__content']}>
          <span className={styles['price-priority-info__title']}>Priorytety cen</span>
          <span className={styles['price-priority-info__text']}>
            Ceny indywidualne mają priorytet nad cenami sezonowymi, a ceny sezonowe mają priorytet nad cenami podstawowymi.
          </span>
          <div className={styles['price-priority-info__chain']}>
            <span>Ceny Indywidualne</span>
            <span className={styles['price-priority-info__arrow']}>→</span>
            <span>Ceny sezonowe</span>
            <span className={styles['price-priority-info__arrow']}>→</span>
            <span>Ceny podstawowe</span>
          </div>
        </div>
      </div>

      <PriceSettingsForm
        properties={serializedProperties}
        childrenFreeAgeLimit={childrenFreeAge}
        seasons={serializedSeasons}
      />
    </div>
  );
}