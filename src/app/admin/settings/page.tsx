import { getSystemConfig } from '@/actions/adminConfigActions';
import ToggleSwitch from './ToggleSwitchClient';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import AdminAccountSettings from './AdminAccountSettings';
import SiteSettingsForm from './SiteSettingsForm';
import styles from './settings.module.css';

export default async function SettingsPage() {
  const config = await getSystemConfig();
  return (
    <div className={styles.adminSettingsContainer}>
      <FloatingBackButton />
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Ustawienia systemu</h1>
        <p className={styles.adminSubtitle}>Zarządzaj globalną polityką wynajmu obiektu.</p>
      </header>

      <section className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Polityka wynajmu</h2>
          <span className={styles.cardBadge}>Globalne</span>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingContent}>
            <label className={styles.settingLabel} htmlFor="auto-block-toggle">Automatyczna blokada drugiego domku</label>
            <p className={styles.settingDescription}>Gdy ta opcja jest <strong>włączona</strong>, rezerwacja jednego domku automatycznie blokuje wszystkie pozostałe na te same daty (zasada &quot;jedna grupa na terenie&quot;).<br />Gdy <strong>wyłączona</strong>, klienci mogą rezerwować domek niezależnie, mimo że drugi jest już zarezerwowany przez innego klienta.</p>
          </div>
          <div className={styles.settingControl}>
            <ToggleSwitch
              initialState={config.autoBlockOtherCabins}
              settingKey="autoBlockOtherCabins"
            />
          </div>
        </div>
      </section>

      <SiteSettingsForm />
      <AdminAccountSettings />
    </div>
  );
}
