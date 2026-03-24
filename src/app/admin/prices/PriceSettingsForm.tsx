'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { updateSeasonPrices } from '@/actions/seasonActions'
import { updateCustompriceForDate, getCustomPrices, deleteCustomPricesForDate } from '@/actions/priceConfigActions'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import dayjs from 'dayjs';
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import Modal from '@/app/_components/Modal/Modal'
import { toast, Toaster } from 'react-hot-toast';
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
  weekdayExtraBedPrice?: number
  weekendExtraBedPrice?: number
}

interface Season {
  _id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  weekdayPrices: PriceTier[];
  weekendPrices: PriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

interface Props {
  properties: PropertyOption[]
  childrenFreeAgeLimit: number
  seasons: Season[]
}

export default function PriceSettingsForm({ properties, childrenFreeAgeLimit, seasons }: Props) {
  const [state, formAction, isPending] = useActionState(updateSeasonPrices, {
    message: '',
    success: false,
  })

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(seasons[0]?._id || '')
  const [weekdayTiers, setWeekdayTiers] = useState<PriceTier[]>([])
  const [weekendTiers, setWeekendTiers] = useState<PriceTier[]>([])
  const [weekdayExtraBedPrice, setWeekdayExtraBedPrice] = useState<number>(50)
  const [weekendExtraBedPrice, setWeekendExtraBedPrice] = useState<number>(70)

  useEffect(() => {
    const season = seasons.find(s => s._id === selectedSeasonId)
    if (season) {
      setWeekdayTiers(season.weekdayPrices?.length ? season.weekdayPrices : [
        { minGuests: 2, maxGuests: 3, price: 300 },
        { minGuests: 4, maxGuests: 5, price: 400 },
        { minGuests: 6, maxGuests: 10, price: 500 }
      ])
      setWeekendTiers(season.weekendPrices?.length ? season.weekendPrices : [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 }
      ])
      setWeekdayExtraBedPrice(season.weekdayExtraBedPrice ?? 50)
      setWeekendExtraBedPrice(season.weekendExtraBedPrice ?? 70)
    }
  }, [selectedSeasonId, seasons])

  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [customPrice, setCustomPrice] = useState<number>(300)
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customWeekdayExtraBedPrice, setCustomWeekdayExtraBedPrice] = useState<number>(50)
  const [customWeekendExtraBedPrice, setCustomWeekendExtraBedPrice] = useState<number>(70)
  const [calendarPrices, setCalendarPrices] = useState<Record<string, number>>({})
  const [selectedDateForPrice, setSelectedDateForPrice] = useState<string | null>(null)

  const [isSavingCustom, setIsSavingCustom] = useState(false)
  const [isDeletingCustom, setIsDeletingCustom] = useState(false)
  const [isCustomPricesExpanded, setIsCustomPricesExpanded] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'weekday' | 'weekend' | null
    index: number | null
  }>({ isOpen: false, type: null, index: null })

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
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
    let setter = setWeekdayTiers;
    if (type === 'weekend') setter = setWeekendTiers;
    setter(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addTier = (type: 'weekday' | 'weekend') => {
    let setter = setWeekdayTiers;
    let tiers = weekdayTiers;
    if (type === 'weekend') { setter = setWeekendTiers; tiers = weekendTiers; }
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
      let setter = setWeekdayTiers;
      if (deleteModal.type === 'weekend') setter = setWeekendTiers;
      setter(prev => prev.filter((_, i) => i !== deleteModal.index))
      setDeleteModal({ isOpen: false, type: null, index: null })
    }
  }

  const handleSaveCustomPrice = async () => {
    if (!selectedProperty || !bookingDates.start) return;
    
    setIsSavingCustom(true);
    
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
        weekdayExtraBedPrice: customWeekdayExtraBedPrice,
        weekendExtraBedPrice: customWeekendExtraBedPrice
      });

      if (result?.success) {
        toast.success(result.message);

        const prices = await getCustomPrices(selectedProperty);
        setCustomPrices(prices);
        
        const priceMap: Record<string, number> = {};
        prices.forEach(p => { priceMap[p.date] = p.price });
        setCalendarPrices(priceMap);
        
        setBookingDates({ start: null, end: null, count: 0 });
        setSelectedDateForPrice(null);
      } else {
        toast.error(result?.message || 'Błąd zapisu.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Wystąpił błąd podczas zapisu.');
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleRemoveCustomPrice = async () => {
    if (!selectedProperty || !bookingDates.start) return;
    
    setIsDeletingCustom(true);
    
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

      const result = await deleteCustomPricesForDate({
        propertyId: selectedProperty,
        dates
      });

      if (result?.success) {
        toast.success(result.message);
        const prices = await getCustomPrices(selectedProperty);
        setCustomPrices(prices);
        const priceMap: Record<string, number> = {};
        prices.forEach(p => { priceMap[p.date] = p.price });
        setCalendarPrices(priceMap);
        setBookingDates({ start: null, end: null, count: 0 });
        setSelectedDateForPrice(null);
      } else {
        toast.error(result?.message || 'Błąd usuwania.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Wystąpił błąd podczas usuwania.');
    } finally {
      setIsDeletingCustom(false);
    }
  };

  const handleDateSelect = (dates: BookingDates) => {
    setBookingDates(dates);
    if (dates.start && !dates.end) {
      setSelectedDateForPrice(dates.start)
      const priceEntry = customPrices.find(p => p.date === dates.start)
      if (priceEntry) {
        setCustomPrice(priceEntry.price)
        setCustomWeekdayExtraBedPrice(priceEntry.weekdayExtraBedPrice ?? 50)
        setCustomWeekendExtraBedPrice(priceEntry.weekendExtraBedPrice ?? 70)
      }
    }
  }

  const getDayType = (dateStr: string) => {
    const day = dayjs(dateStr).day()
    return day === 0 || day === 6 ? 'weekend' : 'weekday'
  }

  const handleSubmit = (formData: FormData) => {
    formData.append('weekdayTiers', JSON.stringify(weekdayTiers))
    formData.append('weekendTiers', JSON.stringify(weekendTiers))
    formData.append('weekdayExtraBedPrice', weekdayExtraBedPrice.toString())
    formData.append('weekendExtraBedPrice', weekendExtraBedPrice.toString())
    formAction(formData)
  }

  return (
    <>
      <form action={handleSubmit} className="settings-card">
        <input type="hidden" name="seasonId" value={selectedSeasonId} />

        <div className="card-header">
          <h2 className="card-title">Konfiguracja cen sezonowych</h2>
          <div className="setting-control" style={{marginLeft: 'auto'}}>
             <select 
                value={selectedSeasonId} 
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="date-input"
                style={{padding: '8px', fontSize: '1rem'}}
             >
                {seasons.map(season => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))}
             </select>
          </div>
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
            <label className="setting-label">Cena za dostawkę (dzień powszedni)</label>
            <p className="setting-description">
              Dodatkowa opłata za dostawkę od niedzieli do czwartku.
            </p>
          </div>
          <div className="setting-control">
            <div className={styles.priceControl}>
              <input
                type="number"
                min="0"
                step="10"
                value={weekdayExtraBedPrice}
                onChange={(e) => setWeekdayExtraBedPrice(parseInt(e.target.value) || 0)}
                className={styles.priceInputLarge}
              />
              <span className={styles.currency}>zł / noc</span>
            </div>
          </div>
        </div>
        
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Cena za dostawkę (weekend)</label>
            <p className="setting-description">
              Dodatkowa opłata za dostawkę w piątki i soboty.
            </p>
          </div>
          <div className="setting-control">
            <div className={styles.priceControl}>
              <input
                type="number"
                min="0"
                step="10"
                value={weekendExtraBedPrice}
                onChange={(e) => setWeekendExtraBedPrice(parseInt(e.target.value) || 0)}
                className={styles.priceInputLarge}
              />
              <span className={styles.currency}>zł / noc</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Zapisywanie...' : `💾 Zapisz konfigurację dla ${seasons.find(s => s._id === selectedSeasonId)?.name || 'sezonu'}`}
          </button>
        </div>
      </form>

      <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
        <div className="card-header">
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
                <label className="setting-label" htmlFor="customWeekdayExtraBedPrice">Cena za dostawkę (dzień powszedni)</label>
                <p className="setting-description">
                  Cena za dostawkę w dni od niedzieli do czwartku.
                </p>
              </div>
              <div className="setting-control">
                <div className={styles.priceControl}>
                  <input
                    id="customWeekdayExtraBedPrice"
                    type="number"
                    min="0"
                    step="10"
                    value={customWeekdayExtraBedPrice}
                    onChange={(e) => setCustomWeekdayExtraBedPrice(parseInt(e.target.value) || 0)}
                    className={styles.priceInputLarge}
                  />
                  <span className={styles.currency}>zł / noc</span>
                </div>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-content">
                <label className="setting-label" htmlFor="customWeekendExtraBedPrice">Cena za dostawkę (weekend)</label>
                <p className="setting-description">
                  Cena za dostawkę w piątki i soboty.
                </p>
              </div>
              <div className="setting-control">
                <div className={styles.priceControl}>
                  <input
                    id="customWeekendExtraBedPrice"
                    type="number"
                    min="0"
                    step="10"
                    value={customWeekendExtraBedPrice}
                    onChange={(e) => setCustomWeekendExtraBedPrice(parseInt(e.target.value) || 0)}
                    className={styles.priceInputLarge}
                  />
                  <span className={styles.currency}>zł / noc</span>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveCustomPrice}
                disabled={isSavingCustom || isDeletingCustom || !bookingDates.start || !selectedProperty}
              >
                {isSavingCustom ? 'Zapisywanie...' : '💾 Zapisz cenę dla wybranych dat'}
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleRemoveCustomPrice}
                disabled={isSavingCustom || isDeletingCustom || !bookingDates.start || !selectedProperty}
              >
                {isDeletingCustom ? 'Przywracanie...' : '🗑️ Przywróć cenę sezonową dla wybranych dat'}
              </button>
            </div>

            {customPrices.length > 0 && (
              <div className="setting-row">
                <div className="setting-content" style={{ width: '100%' }}>
                  <label className="setting-label">Ustawione ceny indywidualne</label>
                  <div className={styles.customPricesList}>
                    {(isCustomPricesExpanded ? customPrices : customPrices.slice(0, 10)).map((entry, idx) => (
                      <div key={idx} className={styles.customPriceItem}>
                        <span className={styles.customPriceDate}>{entry.date}</span>
                        <span className={styles.customPriceValue}>{entry.price} zł</span>
                      </div>
                    ))}
                    {customPrices.length > 10 && (
                      <button
                        type="button"
                        className={styles.moreItems}
                        onClick={() => setIsCustomPricesExpanded(!isCustomPricesExpanded)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {isCustomPricesExpanded ? 'Zwiń' : `+ ${customPrices.length - 10} więcej...`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </form>

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
      <Toaster position="bottom-right" />
    </>
  )
}