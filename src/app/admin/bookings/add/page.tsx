'use client'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { useActionState } from 'react'
import styles from './page.module.css'
import { createManualBooking, calculatePriceAction } from '@/actions/adminBookingActions'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import CalendarPicker from '@/app/_components/CalendarPicker/CalendarPicker'
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

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(createManualBooking, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  const [propertySelection, setPropertySelection] = useState('');
  const [numGuests, setNumGuests] = useState(2);
  const [extraBeds, setExtraBeds] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingDates, setBookingDates] = useState<BookingDates>({ start: null, end: null, count: 0 })
  const [isCalendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [isCalculating, startPriceCalculation] = useTransition();

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
      setNumGuests(2);
      setPropertySelection('');
    }
    if (!state.success && state.message) {
      // alert(`Błąd: ${JSON.stringify(state.message)}`)
    }
  }, [state])

  useEffect(() => {
    const { start, end } = bookingDates;
    if (start && end && numGuests > 0 && propertySelection) {
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          guests: numGuests,
          extraBeds,
          propertySelection
        });
        setTotalPrice(price);
      });
    }
  }, [bookingDates, numGuests, extraBeds, propertySelection]);

  const handleExtraBedsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setExtraBeds(Math.min(4, Math.max(0, value)))
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
            <select id="propertyId" name="propertyId" required onChange={(e) => setPropertySelection(e.target.value)} value={propertySelection}>
              <option value="">Wybierz domek</option>
              <option value="6689871518d963973e488152">Chatka A (Wilcza)</option>
              <option value="6689871518d963973e488153">Chatka B (Leśna)</option>
              <option value="both">Cała posesja</option>
            </select>
          </div>

          <div className={styles.dateBox}>
            <label className={styles.label}>Wybierz termin</label>
            <div className={styles.date} onClick={() => setCalendarOpen(!isCalendarOpen)}>
                <span>
                  {bookingDates.start && bookingDates.end
                    ? `${bookingDates.start} — ${bookingDates.end}`
                    : 'Wybierz daty'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>&#9662;</span>
            </div>

            {isCalendarOpen && (
              <div ref={calendarRef} className={styles.setDate}>
                <CalendarPicker
                  unavailableDates={[]}
                  onDateChange={setBookingDates}
                />
                <button type="button" className={styles.buttOk} onClick={() => setCalendarOpen(false)}>Gotowe</button>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="numGuests">Liczba gości</label>
            <input id="numGuests" name="numGuests" type="number" min="1" max="12" value={numGuests} onChange={e => setNumGuests(Number(e.target.value))} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="extraBeds">Liczba dostawek</label>
            <input 
              id="extraBeds" 
              name="extraBeds" 
              type="number" 
              min="0" 
              max="4" 
              value={extraBeds}
              onChange={handleExtraBedsChange}
              placeholder="0-4"
            />
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
