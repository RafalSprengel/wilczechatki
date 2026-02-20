import { getSystemConfig } from '@/actions/adminConfigActions';
import ConfigToggle from './ConfigToggleClient';
import './settings.css';

export default async function SettingsPage() {
  const config = await getSystemConfig();

  return (
    <div className="admin-settings-container">
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
            <label className="setting-label" htmlFor="auto-block-toggle">
              Automatyczna blokada drugiego domku
            </label>
            <p className="setting-description">
              Gdy ta opcja jest <strong>włączona</strong>, rezerwacja jednego domku 
              automatycznie blokuje wszystkie pozostałe na te same daty 
              (zasada &quot;jedna grupa na terenie&quot;).
              <br />
              Gdy <strong>wyłączona</strong>, klienci mogą rezerwować domek niezależnie, mino że drugi jest juz zarezerwowany przez innego klienta.
            </p>
          </div>
          
          <div className="setting-control">
            <ConfigToggle 
              initialEnabled={config.autoBlockOtherCabins} 
            />
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="card-header">
          <h2 className="card-title">Limity i Zasady</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <p className="setting-info-text">
              Maksymalna liczba gości na domek: <strong>{config.maxGuestsPerCabin}</strong> osób
            </p>
            <p className="setting-info-text">
              Dzieci bezpłatne do lat: <strong>{config.childrenFreeAgeLimit}</strong>
            </p>
            <button className="btn-secondary" disabled>Edytuj limity (wkrótce)</button>
          </div>
        </div>
      </section>
    </div>
  );
}