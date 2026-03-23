'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActionState } from 'react'
import { updatePriceConfig, updateBaseRates, updateCustompriceForDate, getCustomPrices } from '@/actions/priceConfigActions'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import dayjs from 'dayjs';
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import Modal from '@/app/_components/Modal/Modal'
import '../settings/settings.css'
import styles from './page.module.css'

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
}

interface PriceTier {
  minGuests: number
  maxGuests: number
  price: number
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface CustomPriceEntry {
  date: string
  price: number
  propertyId: string
}

interface Props {
  properties: PropertyOption[]
  childrenFreeAgeLimit: number
}

export default function PriceSettingsForm({ properties, childrenFreeAgeLimit }: Props) {
  const [state, formAction, isPending] = useActionState(updatePriceConfig, {
    message: '',
    success: false,
  })

  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState({ text: '', success: false })

  const [weekdayTiers, setWeekdayTiers] = useState<PriceTier[]>([
    { minGuests: 2, maxGuests: 3, price: 300 },
    { minGuests: 4, maxGuests: 5, price: 400 },
    { minGuests: 6, maxGuests: 10, price: 500 }
  ])
  const [weekendTiers, setWeekendTiers] = useState<PriceTier[]>([
    { minGuests: 2, maxGuests: 3, price: 400 },
    { minGuests: 4, maxGuests: 5, price: 500 },
    { minGuests: 6, maxGuests: 10, price: 600 }
  ])
  const [extraBedPrice, setExtraBedPrice] = useState(50)

  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [customPrice, setCustomPrice] = useState<number>(300)
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customExtraBedPrice, setCustomExtraBedPrice] = useState<number>(50)
  const [calendarPrices, setCalendarPrices] = useState<Record<string, number>>({})
  const [selectedDateForPrice, setSelectedDateForPrice] = useState<string | null>(null)

  const [isSavingCustom, setIsSavingCustom] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'weekday' | 'weekend' | null
    index: number | null
  }>({ isOpen: false, type: null, index: null })

  useEffect(() => {
    if (state.message) {
      setMessage({ text: state.message, success: state.success })
      setShowMessage(true)
      const timer = setTimeout(() => setShowMessage(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [state])

  useEffect(() => {
    if (selectedProperty) {
      const loadCustomPrices = async () => {
        const prices = await getCustomPrices(selectedProperty)
        setCustomPrices(prices)
        const priceMap: Record<string, number> = {}
        prices.forEach(p => { priceMap[p.date] = p.price })
        setCalendarPrices(priceMap)
      }
      loadCustomPrices()
    }
  }, [selectedProperty])

  const calendarDates: DatesData = {};
  Object.entries(calendarPrices).forEach(([date, price]) => {
    calendarDates[date] = { price, available: true };
  });

  const handleBaseRateChange = (
    type: 'weekday' | 'weekend',
    index: number,
    field: keyof PriceTier,
    value: number
  ) => {
    const setter = type === 'weekday' ? setWeekdayTiers : setWeekendTiers
    setter(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addTier = (type: 'weekday' | 'weekend') => {
    const setter = type === 'weekday' ? setWeekdayTiers : setWeekendTiers
    const tiers = type === 'weekday' ? weekdayTiers : weekendTiers
    const lastTier = tiers[tiers.length - 1]
    setter(prev => [
      ...prev,
      { minGuests: lastTier.maxGuests + 1, maxGuests: lastTier.maxGuests + 2, price: lastTier.price + 100 }
    ])
  }

  const requestRemoveTier = (type: 'weekday' | 'weekend', index: number) => {
    setDeleteModal({ isOpen: true, type, index })
  }

  const confirmRemoveTier = () => {
    if (deleteModal.type && deleteModal.index !== null) {
      const setter = deleteModal.type === 'weekday' ? setWeekdayTiers : setWeekendTiers
      setter(prev => prev.filter((_, i) => i !== deleteModal.index))
      setDeleteModal({ isOpen: false, type: null, index: null })
    }
  }

  const handleSaveBaseRates = async () => {
    const result = await updateBaseRates({
      weekday: weekdayTiers,
      weekend: weekendTiers,
      extraBedPrice,
      childrenFreeAgeLimit
    })
    if (result.success) {
      setMessage({ text: result.message, success: true })
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 2000)
    } else {
      setMessage({ text: result.message, success: false })
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 2000)
    }
  }

 const handleSaveCustomPrice = async () => {
  if (!selectedProperty || !bookingDates.start) return;
  
  setIsSavingCustom(true);
  console.table([bookingDates.start,bookingDates.end, selectedDateForPrice])
  try {
    const dates: string[] = [];
    const start = dayjs(bookingDates.start);
    
    if (bookingDates.end) {
      const end = dayjs(bookingDates.end);
      let current = start;
      
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        dates.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }
    } else {
      dates.push(start.format('YYYY-MM-DD'));
    }

    const result = await updateCustompriceForDate({
      propertyId: selectedProperty,
      dates,
      price: customPrice,
      extraBedPrice: customExtraBedPrice
    });

    if (result?.success) {
      setMessage({ text: result.message, success: true });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);

      const prices = await getCustomPrices(selectedProperty);
      setCustomPrices(prices);
      
      const priceMap: Record<string, number> = {};
      prices.forEach(p => { priceMap[p.date] = p.price });
      setCalendarPrices(priceMap);
      
      setBookingDates({ start: null, end: null, count: 0 });
      setSelectedDateForPrice(null);
    } else {
      setMessage({ text: result?.message || 'Błąd zapisu.', success: false });
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    }
  } catch (error) {
    console.error(error);
    setMessage({ text: 'Wystąpił błąd podczas zapisu.', success: false });
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  } finally {
    setIsSavingCustom(false);
  }
};

  const handleDateSelect = useCallback((dates: BookingDates) => {
    setBookingDates(prev => {
      if (prev.start === dates.start && prev.end === dates.end && prev.count === dates.count) {
        return prev
      }
      return dates
    })
    if (dates.start && !dates.end) {
      setSelectedDateForPrice(dates.start)
      const price = calendarPrices[dates.start]
      if (price) setCustomPrice(price)
    }
  }, [calendarPrices])

  const getDayType = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day === 0 || day === 6 ? 'weekend' : 'weekday'
  }

  return (
    <form action={formAction} className="settings-card">
      <input type="hidden" name="weekdayTiers" value={JSON.stringify(weekdayTiers)} />
      <input type="hidden" name="weekendTiers" value={JSON.stringify(weekendTiers)} />
      <input type="hidden" name="extraBedPrice" value={extraBedPrice} />
      <input type="hidden" name="childrenFreeAgeLimit" value={childrenFreeAgeLimit} />

      <div className="card-header">
        <h2 className="card-title">Ceny podstawowe</h2>
        <span className="card-badge">Globalne</span>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label className="setting-label">Cena za dobę - Dzień powszedni (nd–czw)</label>
          <p className="setting-description">
            Standardowa stawka obowiązująca od niedzieli do czwartku.
            Ceny są ustalane w przedziałach liczby gości.
          </p>
        </div>
        <div className="setting-control">
          <div className={styles.tiersContainer}>
            {weekdayTiers.map((tier, index) => (
              <div key={index} className={styles.tierRow}>
                <span className={styles.tierRange}>
                  {tier.minGuests}–{tier.maxGuests} os.
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={tier.price}
                  onChange={(e) => handleBaseRateChange('weekday', index, 'price', parseInt(e.target.value) || 0)}
                  className={styles.priceInput}
                />
                <span className={styles.currency}>zł</span>
                {weekdayTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => requestRemoveTier('weekday', index)}
                    className={styles.removeTierBtn}
                    aria-label={`Usuń przedział ${tier.minGuests}-${tier.maxGuests} osób`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addTier('weekday')}
              className={styles.addTierBtn}
            >
              + Dodaj przedział
            </button>
          </div>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label className="setting-label">Cena za dobę - Weekend (pt–sob)</label>
          <p className="setting-description">
            Podwyższona stawka obowiązująca w piątki i soboty.
          </p>
        </div>
        <div className="setting-control">
          <div className={styles.tiersContainer}>
            {weekendTiers.map((tier, index) => (
              <div key={index} className={styles.tierRow}>
                <span className={styles.tierRange}>
                  {tier.minGuests}–{tier.maxGuests} os.
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={tier.price}
                  onChange={(e) => handleBaseRateChange('weekend', index, 'price', parseInt(e.target.value) || 0)}
                  className={styles.priceInput}
                />
                <span className={styles.currency}>zł</span>
                {weekendTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => requestRemoveTier('weekend', index)}
                    className={styles.removeTierBtn}
                    aria-label={`Usuń przedział ${tier.minGuests}-${tier.maxGuests} osób`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addTier('weekend')}
              className={styles.addTierBtn}
            >
              + Dodaj przedział
            </button>
          </div>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label className="setting-label">Cena za dostawkę</label>
          <p className="setting-description">
            Dodatkowa opłata za każde łóżko dostawiane ponad bazową pojemność.
          </p>
        </div>
        <div className="setting-control">
          <div className={styles.priceControl}>
            <input
              type="number"
              min="0"
              step="10"
              value={extraBedPrice}
              onChange={(e) => setExtraBedPrice(parseInt(e.target.value) || 0)}
              className={styles.priceInputLarge}
            />
            <span className={styles.currency}>zł / noc</span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={handleSaveBaseRates} disabled={isPending}>
          {isPending ? 'Zapisywanie...' : '💾 Zapisz ceny podstawowe'}
        </button>
      </div>

      <div className="card-header card-header-spaced">
        <h2 className="card-title">Ceny indywidualne</h2>
        <span className="card-badge">Per domek / data</span>
      </div>

      <div className="setting-row">
        <div className="setting-content">
          <label className="setting-label" htmlFor="propertySelect">Wybierz domek</label>
          <p className="setting-description">
            Wybierz obiekt, dla którego chcesz ustawić niestandardowe ceny.
          </p>
        </div>
        <div className="setting-control">
          <select
            id="propertySelect"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="date-input"
          >
            <option value="">-- Wybierz domek --</option>
            {properties.map(prop => (
              <option key={prop._id} value={prop._id}>{prop.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProperty && (
        <>
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Wybierz datę lub zakres dat</label>
              <p className="setting-description">
                Kliknij na dzień w kalendarzu, aby ustawić cenę.
                Możesz wybrać pojedynczy dzień lub zakres.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.calendarWrapper}>
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={handleDateSelect}
                  minBookingDays={0}
                  maxBookingDays={365}
                />
              </div>
              {bookingDates.start && (
                <div className={styles.selectedDateInfo}>
                  <span>
                    Wybrano: {bookingDates.start}
                    {bookingDates.end && ` — ${bookingDates.end}`}
                  </span>
                  {!bookingDates.end && (
                    <span className={styles.dayType}>
                      ({getDayType(bookingDates.start) === 'weekend' ? 'Weekend' : 'Dzień powszedni'})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label" htmlFor="customPrice">Cena za dobę</label>
              <p className="setting-description">
                Wpisz cenę, która ma obowiązywać w wybranych datach dla tego domku.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  id="customPrice"
                  type="number"
                  min="0"
                  step="10"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                  className={styles.priceInputLarge}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label" htmlFor="customExtraBedPrice">Cena za dostawkę</label>
              <p className="setting-description">
                Wpisz cenę, która ma obowiązywać w wybranych datach dla dostawki.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles.priceControl}>
                <input
                  id="customExtraBedPrice"
                  type="number"
                  min="0"
                  step="10"
                  value={customExtraBedPrice}
                  onChange={(e) => setCustomExtraBedPrice(parseInt(e.target.value) || 0)}
                  className={styles.priceInputLarge}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveCustomPrice}
              disabled={isSavingCustom || !bookingDates.start || !selectedProperty}
            >
              {isSavingCustom ? 'Zapisywanie...' : '💾 Zapisz cenę dla wybranych dat'}
            </button>
          </div>

          {customPrices.length > 0 && (
            <div className="setting-row">
              <div className="setting-content" style={{ width: '100%' }}>
                <label className="setting-label">Ustawione ceny indywidualne</label>
                <div className={styles.customPricesList}>
                  {customPrices.slice(0, 10).map((entry, idx) => (
                    <div key={idx} className={styles.customPriceItem}>
                      <span className={styles.customPriceDate}>{entry.date}</span>
                      <span className={styles.customPriceValue}>{entry.price} zł</span>
                    </div>
                  ))}
                  {customPrices.length > 10 && (
                    <span className={styles.moreItems}>+ {customPrices.length - 10} więcej...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showMessage && (
        <div className={`form-message ${message.success ? 'success-message' : 'error-message'}`}>
          {message.text}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, index: null })}
        onConfirm={confirmRemoveTier}
        title="Usuń przedział cenowy"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
      >
        <p>
          Czy na pewno chcesz usunąć ten przedział cenowy?
          Ta operacja nie może zostać cofnięta.
        </p>
      </Modal>
    </form>
  )
}