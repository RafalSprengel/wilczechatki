'use client'
import { useEffect, useRef, useState } from 'react'
import { useActionState } from 'react'
import styles from './page.module.css'
import { createManualBooking } from '@/actions/adminBookingActions'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'

const initialState = {
  message: '',
  success: false,
}

function SubmitButton() {
  const { pending } = useActionState()
  return (
    <button type="submit" className={styles.btnSubmit} disabled={pending}>
      {pending ? 'Zapisuję...' : 'Zapisz Rezerwację'}
    </button>
  )
}

export default function AddBookingPage() {
  const [state, formAction] = useActionState(createManualBooking, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [extraBeds, setExtraBeds] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    if (state.success) {
      alert(state.message)
      formRef.current?.reset()
      setExtraBeds(0)
      setPaidAmount(0)
      setTotalPrice(0)
    }
    if (!state.success && state.message) {
      alert(`Błąd: ${state.message}`)
    }
  }, [state])

  const handleExtraBedsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setExtraBeds(Math.min(4, Math.max(0, value)))
  }

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setPaidAmount(Math.max(0, value))
  }

  const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setTotalPrice(value)
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
      {state?.message && !state.success && (
        <div className={styles.errorBox}>{state.message}</div>
      )}
      <form ref={formRef} action={formAction} className={styles.formCard}>
        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Data przyjazdu</label>
            <input id="startDate" type="date" required name="startDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="endDate">Data wyjazdu</label>
            <input id="endDate" type="date" required name="endDate" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Obiekt</label>
            <select id="propertyId" name="propertyId" required>
              <option value="">Wybierz domek</option>
              <option value="cabin1">Chatka A (Wilcza)</option>
              <option value="cabin2">Chatka B (Leśna)</option>
              <option value="both">Cała posesja</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="numGuests">Liczba gości</label>
            <input id="numGuests" name="numGuests" type="number" min="1" max="12" defaultValue="2" />
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
            <small className={styles.hint}>Maksymalnie 4 dostawki (2 na domek przy całej posesji)</small>
          </div>
        </div>
        
        <div className={styles.sectionTitle}>Płatność</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Cena całkowita (PLN) *</label>
            <input 
              id="totalPrice" 
              name="totalPrice" 
              type="number" 
              required 
              placeholder="0.00" 
              step="0.01"
              min="0"
              value={totalPrice || ''}
              onChange={handleTotalPriceChange}
            />
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
            <small className={styles.hint}>Kwota już wpłacona przez gościa</small>
          </div>
          <div className={styles.inputGroup}>
            <label>Do zapłaty</label>
            <div className={styles.remainingAmount}>
              <span className={styles.remainingValue}>{remainingAmount.toFixed(2)} zł</span>
              {remainingAmount > 0 && (
                <span className={styles.remainingHint}>Do dopłaty przez gościa</span>
              )}
              {remainingAmount === 0 && totalPrice > 0 && (
                <span className={styles.paidFull}>✓ Opłacone w całości</span>
              )}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Status płatności</label>
            <span className={`${styles.badge} ${paymentBadge.class}`}>{paymentBadge.text}</span>
            <small className={styles.hint}>
              Status wyliczany automatycznie na podstawie kwoty wpłaconej
            </small>
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
          <button type="button" className={styles.btnCancel} onClick={() => {
            formRef.current?.reset()
            setExtraBeds(0)
            setPaidAmount(0)
            setTotalPrice(0)
          }}>Anuluj</button>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}