'use client'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { useActionState } from 'react'
import styles from './page.module.css'
import { createManualBooking, calculatePriceAction, getUnavailableDatesForProperty } from '@/actions/adminBookingActions'
import { getAllProperties } from '@/actions/adminPropertyActions'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import CalendarPicker from '@/app/_components/CalendarPicker/CalendarPicker'
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import { useClickOutside } from '@/hooks/useClickOutside'

const initialState = {
  message: '',
  success: false,
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
}

interface UnavailableDate {
  date: string | null
}

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(createManualBooking, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [propertySelection, setPropertySelection] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null)
  
  const [numGuests, setNumGuests] = useState(2)
  const [extraBeds, setExtraBeds] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [isCalendarOpen, setCalendarOpen] = useState(false)
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([])
  
  const calendarRef = useRef<HTMLDivElement>(null)
  const [isCalculating, startPriceCalculation] = useTransition()

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getAllProperties()
        setProperties(data)
      } catch (error) {
        console.error('Failed to load properties:', error)
      }
    }
    loadProperties()
  }, [])

  useEffect(() => {
    if (propertySelection && propertySelection !== 'both') {
      const prop = properties.find(p => p._id === propertySelection)
      setSelectedProperty(prop || null)
    } else if (propertySelection === 'both') {
      setSelectedProperty({
        _id: 'both',
        name: 'Cała posesja',
        baseCapacity: properties.reduce((sum, p) => sum + p.baseCapacity, 0),
        maxExtraBeds: properties.reduce((sum, p) => sum + p.maxExtraBeds, 0)
      })
    } else {
      setSelectedProperty(null)
    }
    setBookingDates({ start: null, end: null, count: 0 })
    setTotalPrice(0)
  }, [propertySelection, properties])

  useEffect(() => {
    if (selectedProperty) {
      const maxGuests = selectedProperty.baseCapacity
      const maxExtraBedsValue = selectedProperty.maxExtraBeds
      
      // Resetuj liczbę gości jeśli przekracza limit nowego obiektu
      if (numGuests > maxGuests) {
        setNumGuests(Math.min(2, maxGuests))
      }
      
      // Resetuj dostawki jeśli przekracza limit nowego obiektu
      if (extraBeds > maxExtraBedsValue) {
        setExtraBeds(0)
      }
    }
  }, [selectedProperty])

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (propertySelection) {
        try {
          const dates = await getUnavailableDatesForProperty(propertySelection)
          setUnavailableDates(dates)
        } catch (error) {
          console.error('Failed to fetch unavailable dates:', error)
        }
      } else {
        setUnavailableDates([])
      }
    }
    fetchUnavailableDates()
  }, [propertySelection])

  useClickOutside(calendarRef, () => {
    if (isCalendarOpen) setCalendarOpen(false)
  })

  useEffect(() => {
    if (state.success) {
      alert(state.message)
      formRef.current?.reset()
      setExtraBeds(0)
      setPaidAmount(0)
      setTotalPrice(0)
      setBookingDates({ start: null, end: null, count: 0 })
      setNumGuests(2)
      setPropertySelection('')
      setSelectedProperty(null)
    }
    if (!state.success && state.message) {
      // alert(`Błąd: ${JSON.stringify(state.message)}`)
    }
  }, [state])

  useEffect(() => {
    const { start, end } = bookingDates
    if (start && end && numGuests > 0 && propertySelection) {
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          guests: numGuests,
          extraBeds,
          propertySelection
        })
        setTotalPrice(price)
      })
    }
  }, [bookingDates, numGuests, extraBeds, propertySelection])

  const handleExtraBedsChange = (value: number) => {
    setExtraBeds(value)
  }

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setPaidAmount(Math.max(0, value))
  }

  const remainingAmount = Math.max(0, totalPrice - paidAmount)

  const getPaymentBadge = () => {
    if (paidAmount >= totalPrice && totalPrice > 0) return { text: 'Opłacone', class: styles.paymentPaid }
    if (paidAmount > 0) return { text: 'Zaliczka', class: styles.paymentDeposit }
    return { text: 'Nieopłacone', class: styles.paymentUnpaid }
  }

  const paymentBadge = getPaymentBadge()

  const maxGuests = selectedProperty ? selectedProperty.baseCapacity : 12
  const maxExtraBedsValue = selectedProperty ? selectedProperty.maxExtraBeds : 4

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <header className={styles.header}>
        <h1>Dodaj Nową Rezerwację</h1>
        <p>Ręczne wprowadzenie rezerwacji (np. telefonicznej)</p>
      </header>
     
      <form ref={formRef} action={formAction} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <input type="hidden" name="startDate" value={bookingDates.start || ''} />
          <input type="hidden" name="endDate" value={bookingDates.end || ''} />

          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select 
              id="propertyId" 
              name="propertyId" 
              required 
              onChange={(e) => setPropertySelection(e.target.value)} 
              value={propertySelection}
            >
              <option value="">Wybierz domek</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
              {properties.length > 1 && (
                <option value="both">Cała posesja</option>
              )}
            </select>
          </div>

          <div className={styles.dateBox}>
            <label className={styles.label}>Wybierz termin</label>
            <div 
              className={styles.date} 
              onClick={() => propertySelection && setCalendarOpen(!isCalendarOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                width: '100%',
                cursor: propertySelection ? 'pointer' : 'not-allowed',
                opacity: propertySelection ? 1 : 0.6
              }}
            >
              <span>
                {bookingDates.start && bookingDates.end
                  ? `${bookingDates.start} — ${bookingDates.end}`
                  : propertySelection ? 'Wybierz daty' : 'Najpierw wybierz obiekt'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>&#9662;</span>
            </div>

            {isCalendarOpen && (
              <div
                ref={calendarRef}
                className={`${styles.setDate} ${isCalendarOpen ? styles.expandedDate : ''}`}
              >
                <CalendarPicker
                  unavailableDates={unavailableDates}
                  onDateChange={setBookingDates}
                />
                <button type="button" className={styles.buttOk} onClick={() => setCalendarOpen(false)}>Gotowe</button>
              </div>
            )}
          </div>

          <div className={styles.inputGroup} style={{ opacity: propertySelection ? 1 : 0.6, pointerEvents: propertySelection ? 'auto' : 'none' }}>
            <label htmlFor="numGuests">Liczba gości</label>
            <QuantityPicker
              value={numGuests}
              onIncrement={() => setNumGuests(prev => Math.min(maxGuests, prev + 1))}
              onDecrement={() => setNumGuests(prev => Math.max(1, prev - 1))}
              min={1}
              max={maxGuests}
            />
            <small className={styles.hint}>Maksymalnie {maxGuests} osób</small>
          </div>

          <div className={styles.inputGroup} style={{ opacity: propertySelection ? 1 : 0.6, pointerEvents: propertySelection ? 'auto' : 'none' }}>
            <label htmlFor="extraBeds">Liczba dostawek</label>
            <QuantityPicker
              value={extraBeds}
              onIncrement={() => handleExtraBedsChange(Math.min(maxExtraBedsValue, extraBeds + 1))}
              onDecrement={() => handleExtraBedsChange(Math.max(0, extraBeds - 1))}
              min={0}
              max={maxExtraBedsValue}
            />
            <small className={styles.hint}>Maksymalnie {maxExtraBedsValue} dostawek</small>
          </div>
        </div>
        
        <div className={styles.sectionTitle}>Płatność</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN) *</label>
            <div className={styles.priceInputWrapper}>
              <input 
                id="totalPrice" 
                name="totalPrice" 
                type="number" 
                required 
                placeholder="0.00" 
                step="0.01"
                min="0"
                value={totalPrice || ''}
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              />
              {isCalculating && <div className={styles.spinner}></div>}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="paidAmount">Wpłacono (PLN)</label>
            <input 
              id="paidAmount" 
              name="paidAmount" 
              type="number" 
              placeholder="0.00" 
              step="0.01" 
              min="0"
              max={totalPrice}
              value={paidAmount || ''}
              onChange={handlePaidAmountChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Do zapłaty</label>
            <div className={styles.remainingAmount}>
              <span className={styles.remainingValue}>{remainingAmount.toFixed(2)} zł</span>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Status płatności</label>
            <span className={`${styles.badge} ${paymentBadge.class}`}>{paymentBadge.text}</span>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="guestName">Imię i Nazwisko</label>
            <input id="guestName" name="guestName" type="text" required placeholder="np. Jan Kowalski" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">Email</label>
            <input id="guestEmail" name="guestEmail" type="email" required placeholder="jan@example.com" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Telefon</label>
            <input id="guestPhone" name="guestPhone" type="tel" required placeholder="+48 123 456 789" />
          </div>
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="internalNotes">Uwagi wewnętrzne</label>
          <textarea id="internalNotes" name="internalNotes" rows={3} placeholder="Np. Gość prosi o łóżeczko dla dziecka"></textarea>
        </div>
        
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={() => formRef.current?.reset()}>Anuluj</button>
          <button type="submit" className={styles.btnSubmit} disabled={isPending}>
            {isPending ? 'Zapisuję...' : 'Zapisz Rezerwację'}
          </button>
        </div>
      </form>
    </div>
  )
}