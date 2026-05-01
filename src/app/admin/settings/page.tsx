import { getSystemConfig } from '@/actions/adminConfigActions';
import ToggleSwitch from './ToggleSwitchClient';
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton';
import AdminAccountSettings from './AdminAccountSettings';

export default async function SettingsPage() {
  const config = await getSystemConfig();
  return (
    <div className="admin-settings-container">
      <FloatingBackButton />
      <header className="admin-header">
        <h1 className="admin-title">Ustawienia Systemu</h1>
        <p className="admin-subtitle">Zarządzaj globalną polityką wynajmu obiektu</p>
      </header>
      
      <section className="settings-card">
        <div className="card-header">
          <h2 className="card-title">Polityka Wynajmu</h2>
          <span className="card-badge">Globalne</span>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label" htmlFor="auto-block-toggle">Automatyczna blokada drugiego domku</label>
            <p className="setting-description">Gdy ta opcja jest <strong>włączona</strong>, rezerwacja jednego domku automatycznie blokuje wszystkie pozostałe na te same daty (zasada &quot;jedna grupa na terenie&quot;).<br />Gdy <strong>wyłączona</strong>, klienci mogą rezerwować domek niezależnie, mimo że drugi jest już zarezerwowany przez innego klienta.</p>
          </div>
          <div className="setting-control">
            <ToggleSwitch 
              initialState={config.autoBlockOtherCabins}
              settingKey="autoBlockOtherCabins"
            />
          </div>
        </div>
      </section>

      <AdminAccountSettings />
    </div>
  );
}