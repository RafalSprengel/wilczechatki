'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { updateBookingConfig, updateAllowCheckinOnDepartureDay } from '@/actions/bookingConfigActions';
import { getAllSeasons, updateSeasonDates, updateSeasonOrder, SeasonData } from '@/actions/seasonActions';
import dayjs from 'dayjs';
import '../settings.css';

interface BookingConfig {
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart: string | null;
  highSeasonEnd: string | null;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
}

interface Props {
  initialConfig: BookingConfig;
}

export default function BookingSettingsForm({ initialConfig }: Props) {
  const [state, formAction, isPending] = useActionState(updateBookingConfig, {
    message: '',
    success: false,
  });

  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState({ text: '', success: false });

  const [localMinDays, setLocalMinDays] = useState(initialConfig.minBookingDays);
  const [localMaxDays, setLocalMaxDays] = useState(initialConfig.maxBookingDays);
  const [localHighSeasonStart, setLocalHighSeasonStart] = useState(initialConfig.highSeasonStart);
  const [localHighSeasonEnd, setLocalHighSeasonEnd] = useState(initialConfig.highSeasonEnd);
  const [localChildrenFreeAge, setLocalChildrenFreeAge] = useState(initialConfig.childrenFreeAgeLimit);
  const [localCheckInHour, setLocalCheckInHour] = useState(initialConfig.checkInHour);
  const [localCheckOutHour, setLocalCheckOutHour] = useState(initialConfig.checkOutHour);

  const [allowCheckin, setAllowCheckin] = useState(initialConfig.allowCheckinOnDepartureDay);
  const [togglePending, startToggleTransition] = useTransition();

  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [isUpdatingSeason, setIsUpdatingSeason] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');
  const [seasonOrder, setSeasonOrder] = useState<number>(0);

  useEffect(() => {
    const loadSeasons = async () => {
      setIsLoadingSeasons(true);
      const seasonsList = await getAllSeasons();
      setSeasons(seasonsList);
      if (seasonsList.length > 0) {
        setSelectedSeasonId(seasonsList[0]._id);
        setSelectedSeason(seasonsList[0]);
        setSeasonStartDate(dayjs(seasonsList[0].startDate).format('YYYY-MM-DD'));
        setSeasonEndDate(dayjs(seasonsList[0].endDate).format('YYYY-MM-DD'));
        setSeasonOrder(seasonsList[0].order);
      }
      setIsLoadingSeasons(false);
    };
    loadSeasons();
  }, []);

  useEffect(() => {
    const season = seasons.find(s => s._id === selectedSeasonId);
    setSelectedSeason(season || null);
    if (season) {
      setSeasonStartDate(dayjs(season.startDate).format('YYYY-MM-DD'));
      setSeasonEndDate(dayjs(season.endDate).format('YYYY-MM-DD'));
      setSeasonOrder(season.order);
    }
  }, [selectedSeasonId, seasons]);

  useEffect(() => {
    setAllowCheckin(initialConfig.allowCheckinOnDepartureDay);
  }, [initialConfig.allowCheckinOnDepartureDay]);

  useEffect(() => {
    if (state.message) {
      setMessage({ text: state.message, success: state.success });
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleToggle = () => {
    const newValue = !allowCheckin;
    startToggleTransition(async () => {
      const result = await updateAllowCheckinOnDepartureDay(newValue);
      if (result.success) {
        setAllowCheckin(newValue);
      } else {
        alert(result.message || 'Błąd zapisu');
      }
    });
  };

  const handleUpdateSeasonDates = async () => {
    if (!selectedSeasonId || !seasonStartDate || !seasonEndDate) return;
    
    setIsUpdatingSeason(true);
    const result = await updateSeasonDates(selectedSeasonId, seasonStartDate, seasonEndDate);
    if (result.success) {
      const updatedSeasons = await getAllSeasons();
      setSeasons(updatedSeasons);
      const updatedSeason = updatedSeasons.find(s => s._id === selectedSeasonId);
      if (updatedSeason) {
        setSelectedSeason(updatedSeason);
      }
      setMessage({ text: result.message, success: true });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    } else {
      alert(result.message);
    }
    setIsUpdatingSeason(false);
  };

  const handleUpdateSeasonOrder = async () => {
    if (!selectedSeasonId) return;
    
    setIsUpdatingOrder(true);
    const result = await updateSeasonOrder(selectedSeasonId, seasonOrder);
    if (result.success) {
      const updatedSeasons = await getAllSeasons();
      setSeasons(updatedSeasons);
      setMessage({ text: result.message, success: true });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    } else {
      alert(result.message);
    }
    setIsUpdatingOrder(false);
  };

  const handleBlurMinDays = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) {
      setLocalMinDays(val);
    } else {
      e.target.value = localMinDays.toString();
    }
  };

  const handleBlurMaxDays = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) {
      setLocalMaxDays(val);
    } else {
      e.target.value = localMaxDays.toString();
    }
  };

  const handleBlurChildrenFreeAge = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setLocalChildrenFreeAge(val);
    } else {
      e.target.value = localChildrenFreeAge.toString();
    }
  };

  const handleBlurCheckIn = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 0 || val > 23) {
      e.target.value = localCheckInHour.toString();
      return;
    }
    if (val < localCheckOutHour) {
      alert('Godzina rozpoczęcia doby nie może być wcześniejsza niż godzina zakończenia doby.');
      e.target.value = localCheckInHour.toString();
      return;
    }
    setLocalCheckInHour(val);
  };

  const handleBlurCheckOut = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 0 || val > 23) {
      e.target.value = localCheckOutHour.toString();
      return;
    }
    if (val > localCheckInHour) {
      alert('Godzina zakończenia doby nie może być późniejsza niż godzina rozpoczęcia doby.');
      e.target.value = localCheckOutHour.toString();
      return;
    }
    setLocalCheckOutHour(val);
  };

  return (
    <form action={formAction} className="settings-card">
      <input type="hidden" name="minBookingDays" value={localMinDays} />
      <input type="hidden" name="maxBookingDays" value={localMaxDays} />
      <input type="hidden" name="highSeasonStart" value={localHighSeasonStart || ''} />
      <input type="hidden" name="highSeasonEnd" value={localHighSeasonEnd || ''} />
      <input type="hidden" name="childrenFreeAgeLimit" value={localChildrenFreeAge} />
      <input type="hidden" name="checkInHour" value={localCheckInHour} />
      <input type="hidden" name="checkOutHour" value={localCheckOutHour} />

      <div className="card-header">
        <h2 className="card-title">Długość pobytu</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="minBookingDays" className="setting-label">Minimalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu krótszego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="minBookingDays"
            min="1"
            max="30"
            defaultValue={localMinDays}
            onBlur={handleBlurMinDays}
            className="number-input"
          />
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="maxBookingDays" className="setting-label">Maksymalna liczba nocy</label>
          <p className="setting-description">Klient nie może wybrać okresu dłuższego.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="maxBookingDays"
            min="1"
            max="90"
            defaultValue={localMaxDays}
            onBlur={handleBlurMaxDays}
            className="number-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Sezony cenowe</h2>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label className="setting-label">Wybierz sezon do edycji</label>
          <p className="setting-description">Zarządzaj datami obowiązywania poszczególnych sezonów.</p>
        </div>
        <div className="setting-control">
          {isLoadingSeasons ? (
            <span>Ładowanie sezonów...</span>
          ) : seasons.length === 0 ? (
            <span className="status-inactive">Brak zdefiniowanych sezonów</span>
          ) : (
            <select
              id="seasonSelect"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="date-input"
              style={{ width: '100%', padding: '8px' }}
            >
              {seasons.map((season) => (
                <option key={season._id} value={season._id}>
                  {season.name} {!season.isActive && '(nieaktywny)'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedSeason && (
        <>
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">
                {selectedSeason.name}
              </label>
              {selectedSeason.description && (
                <p className="setting-description">{selectedSeason.description}</p>
              )}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Data rozpoczęcia</label>
            </div>
            <div className="setting-control">
              <input
                type="date"
                value={seasonStartDate}
                onChange={(e) => setSeasonStartDate(e.target.value)}
                className="date-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Data zakończenia</label>
            </div>
            <div className="setting-control">
              <input
                type="date"
                value={seasonEndDate}
                onChange={(e) => setSeasonEndDate(e.target.value)}
                className="date-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Kolejność wyświetlania</label>
              <p className="setting-description">
                Niższa wartość oznacza wyższą pozycję na liście (1, 2, 3...).
              </p>
            </div>
            <div className="setting-control">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={seasonOrder}
                  onChange={(e) => setSeasonOrder(parseInt(e.target.value) || 0)}
                  className="number-input"
                  style={{ width: '80px' }}
                />
                <button
                  type="button"
                  onClick={handleUpdateSeasonOrder}
                  disabled={isUpdatingOrder}
                  className="btn-secondary"
                >
                  {isUpdatingOrder ? 'Zapisywanie...' : 'Zapisz kolejność'}
                </button>
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content"></div>
            <div className="setting-control">
              <button
                type="button"
                onClick={handleUpdateSeasonDates}
                disabled={isUpdatingSeason}
                className="btn-primary"
              >
                {isUpdatingSeason ? 'Zapisywanie...' : 'Zapisz daty sezonu'}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Dzieci</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="childrenFreeAgeLimit" className="setting-label">Wiek dzieci bezpłatnych (do lat)</label>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="childrenFreeAgeLimit"
            min="0"
            max="18"
            defaultValue={localChildrenFreeAge}
            onBlur={handleBlurChildrenFreeAge}
            className="number-input"
          />
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Dostępność terminów</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="allowCheckinOnDepartureDay" className="setting-label">
            Zezwalaj na zameldowanie w dniu wymeldowania poprzednich gości
          </label>
          <p className="setting-description">
            Jeśli włączone, nowi goście mogą przyjechać tego samego dnia, w którym poprzedni wyjeżdżają (po {localCheckOutHour}:00).<br />
            Jeśli wyłączone, dzień wymeldowania jest niedostępny dla nowych rezerwacji.
          </p>
        </div>
        <div className="setting-control">
          <div className="toggle-wrapper">
            <button
              type="button"
              onClick={handleToggle}
              disabled={togglePending}
              className={`toggle-switch ${allowCheckin ? 'toggle-on' : 'toggle-off'} ${togglePending ? 'toggle-disabled' : ''}`}
              aria-pressed={allowCheckin}
            >
              <span className="toggle-knob" />
            </button>
            <span className={`toggle-status-label ${allowCheckin ? 'status-active' : 'status-inactive'}`}>
              {allowCheckin ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </span>
            {togglePending && <span className="loading-spinner">Zapisywanie...</span>}
          </div>
        </div>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Doba hotelowa</h2>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="checkInHour" className="setting-label">Godzina rozpoczęcia doby (check-in)</label>
          <p className="setting-description">Od której godziny można się zameldować w dniu przyjazdu.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="checkInHour"
            name="checkInHour"
            min="0"
            max="23"
            step="1"
            defaultValue={localCheckInHour}
            onBlur={handleBlurCheckIn}
            className="number-input"
          />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-content">
          <label htmlFor="checkOutHour" className="setting-label">Godzina zakończenia doby (check-out)</label>
          <p className="setting-description">Do której godziny trzeba opuścić domek w dniu wyjazdu.</p>
        </div>
        <div className="setting-control">
          <input
            type="number"
            id="checkOutHour"
            name="checkOutHour"
            min="0"
            max="23"
            step="1"
            defaultValue={localCheckOutHour}
            onBlur={handleBlurCheckOut}
            className="number-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </div>

      {showMessage && (
        <div className={`form-message ${message.success ? 'success-message' : 'error-message'}`}>
          {message.text}
        </div>
      )}
    </form>
  );
}