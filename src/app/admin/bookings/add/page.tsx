'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { useActionState } from 'react'
import styles from './page.module.css'
import { createBookingByAdmin, calculatePriceAction, getUnavailableDatesForProperty } from '@/actions/adminBookingActions'
import { getAllProperties } from '@/actions/adminPropertyActions'
import { getBookingConfig } from '@/actions/bookingConfigActions'
import FloatingBackButton from '@/app/_components/FloatingBackButton/FloatingBackButton'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import QuantityPicker from '@/app/_components/QuantityPicker/QuantityPicker'
import { useClickOutside } from '@/hooks/useClickOutside'

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface PropertyOption {
  _id: string
  name: string
  type: 'single' | 'whole'
  baseCapacity: number
  maxExtraBeds: number
}

interface InvoiceData {
  companyName: string
  nip: string
  street: string
  postalCode: string
  city: string
}

const initialState = {
  message: '',
  success: false,
}

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(createBookingByAdmin, initialState)
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
  const [calendarDates, setCalendarDates] = useState<DatesData>({})
  const calendarRef = useRef<HTMLDivElement>(null)
  const [isCalculating, startPriceCalculation] = useTransition()
  const [wantsInvoice, setWantsInvoice] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: '',
    nip: '',
    street: '',
    postalCode: '',
    city: '',
  })
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({})
  const [minBookingDays, setMinBookingDays] = useState(1)
  const [maxBookingDays, setMaxBookingDays] = useState(30)

  const isDateRangeSelected = !!(bookingDates.start && bookingDates.end)

  useEffect(() => {
    const loadInitialData = async () => {
      const [props, config] = await Promise.all([
        getAllProperties(),
        getBookingConfig()
      ]);
      setProperties(props);
      setMinBookingDays(config.minBookingDays);
      setMaxBookingDays(config.maxBookingDays);
    };
    loadInitialData();
  }, [])

  useEffect(() => {
    if (propertySelection) {
      const prop = properties.find(p => p._id === propertySelection)
      setSelectedProperty(prop || null)
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
      if (numGuests > maxGuests) {
        setNumGuests(Math.min(2, maxGuests))
      }
      if (extraBeds > maxExtraBedsValue) {
        setExtraBeds(0)
      }
    }
  }, [selectedProperty, numGuests, extraBeds])

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (propertySelection) {
        try {
          const dates = await getUnavailableDatesForProperty(propertySelection)
          const mappedDates: DatesData = {}
          dates.forEach((entry) => {
            if (entry.date) {
              mappedDates[entry.date] = { available: false }
            }
          })
          setCalendarDates(mappedDates)
        } catch (error) {
          console.error('Failed to fetch unavailable dates:', error)
        }
      } else {
        setCalendarDates({})
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
      setWantsInvoice(false)
      setInvoiceData({
        companyName: '',
        nip: '',
        street: '',
        postalCode: '',
        city: '',
      })
      setInvoiceErrors({})
    } else if (state.message && !state.success) {
      alert(state.message)
    }
  }, [state])

  useEffect(() => {
    const { start, end } = bookingDates
    if (start && end && numGuests > 0 && propertySelection) {
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          baseGuests: numGuests,
          extraBeds,
          propertySelection
        })
        setTotalPrice(price)
      })
    }
  }, [bookingDates, numGuests, extraBeds, propertySelection])

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setPaidAmount(Math.max(0, value))
  }

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInvoiceData(prev => ({ ...prev, [name]: value }))
    if (invoiceErrors[name]) {
      setInvoiceErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateInvoiceData = (): boolean => {
    const errors: Record<string, string> = {}
    if (!invoiceData.companyName.trim()) errors.companyName = 'Wymagane'
    if (!invoiceData.nip.trim()) {
      errors.nip = 'Wymagane'
    } else if (!/^[\d-]{10,13}$/.test(invoiceData.nip.replace(/-/g, ''))) {
      errors.nip = 'Błędny NIP'
    }
    if (!invoiceData.street.trim()) errors.street = 'Wymagane'
    if (!invoiceData.postalCode.trim()) {
      errors.postalCode = 'Wymagane'
    } else if (!/^\d{2}-\d{3}$/.test(invoiceData.postalCode)) {
      errors.postalCode = 'Format XX-XXX'
    }
    if (!invoiceData.city.trim()) errors.city = 'Wymagane'
    setInvoiceErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetAll = () => {
    formRef.current?.reset()
    setPropertySelection('')
    setBookingDates({ start: null, end: null, count: 0 })
    setTotalPrice(0)
    setPaidAmount(0)
    setNumGuests(2)
    setExtraBeds(0)
    setWantsInvoice(false)
    setInvoiceData({ companyName: '', nip: '', street: '', postalCode: '', city: '' })
    setInvoiceErrors({})
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (wantsInvoice && !validateInvoiceData()) {
      e.preventDefault()
      alert('Proszę poprawnie uzupełnić dane do faktury.')
      return
    }
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

      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className={styles.formCard}>
        <input type="hidden" name="startDate" value={bookingDates.start || ''} />
        <input type="hidden" name="endDate" value={bookingDates.end || ''} />
        <input type="hidden" name="numGuests" value={numGuests} />
        <input type="hidden" name="extraBeds" value={extraBeds} />
        <input type="hidden" name="totalPrice" value={totalPrice} />
        <input type="hidden" name="paidAmount" value={paidAmount} />
        <input type="hidden" name="invoice" value={wantsInvoice ? 'true' : 'false'} />
        <input type="hidden" name="invoiceCompany" value={invoiceData.companyName} />
        <input type="hidden" name="invoiceNip" value={invoiceData.nip} />
        <input type="hidden" name="invoiceStreet" value={invoiceData.street} />
        <input type="hidden" name="invoicePostalCode" value={invoiceData.postalCode} />
        <input type="hidden" name="invoiceCity" value={invoiceData.city} />

        <div className={styles.sectionTitle}>Termin i Obiekt</div>
        <div className={styles.grid}>
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
            </select>
          </div>

          <div className={styles.dateBox}>
            <label className={styles.label}>Wybierz termin</label>
            <div
              className={`${styles.date} ${!propertySelection ? styles.dateDisabled : ''}`}
              onClick={() => propertySelection && setCalendarOpen(!isCalendarOpen)}
            >
              <span>
                {bookingDates.start && bookingDates.end
                  ? `${bookingDates.start} — ${bookingDates.end}`
                  : propertySelection ? 'Wybierz daty' : 'Najpierw wybierz obiekt'}
              </span>
              <span className={styles.dateArrow}>&#9662;</span>
            </div>
            {isCalendarOpen && (
              <div ref={calendarRef} className={`${styles.setDate} ${isCalendarOpen ? styles.expandedDate : ''}`}>
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={setBookingDates}
                  minBookingDays={minBookingDays}
                  maxBookingDays={maxBookingDays}
                />
                <button type="button" className={styles.buttOk} onClick={() => setCalendarOpen(false)}>Gotowe</button>
              </div>
            )}
          </div>

          <div className={`${styles.inputGroup} ${!propertySelection ? styles.disabledGroup : ''}`}>
            <label>Liczba gości</label>
            <QuantityPicker
              value={numGuests}
              onIncrement={() => setNumGuests(prev => Math.min(maxGuests, prev + 1))}
              onDecrement={() => setNumGuests(prev => Math.max(1, prev - 1))}
              min={1}
              max={maxGuests}
            />
          </div>

          <div className={`${styles.inputGroup} ${!propertySelection ? styles.disabledGroup : ''}`}>
            <label>Liczba dostawek</label>
            <QuantityPicker
              value={extraBeds}
              onIncrement={() => setExtraBeds(prev => Math.min(maxExtraBedsValue, prev + 1))}
              onDecrement={() => setExtraBeds(prev => Math.max(0, prev - 1))}
              min={0}
              max={maxExtraBedsValue}
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
                type="number"
                required
                step="0.01"
                min="0.01"
                value={totalPrice || ''}
                disabled={isCalculating || !propertySelection || !isDateRangeSelected}
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              />
              {isCalculating && <div className={styles.spinner}></div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="paidAmount">Wpłacono (PLN)</label>
            <input
              id="paidAmount"
              type="number"
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

        <div className={styles.sectionTitle}>Dodatkowe opcje</div>
        <div className={styles.invoiceOptionGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
            />
            <span>Chcę otrzymać fakturę VAT</span>
          </label>
        </div>

        <div className={`${styles.invoiceWrapper} ${wantsInvoice ? styles.expanded : ''}`}>
          <div className={styles.invoiceContent}>
            <h3 className={styles.invoiceTitle}>Dane do faktury VAT</h3>
            <div className={styles.inputGroup}>
              <label>Nazwa firmy *</label>
              <input
                name="companyName"
                type="text"
                value={invoiceData.companyName}
                onChange={handleInvoiceChange}
                className={invoiceErrors.companyName ? styles.inputError : ''}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>NIP *</label>
              <input
                name="nip"
                type="text"
                value={invoiceData.nip}
                onChange={handleInvoiceChange}
                className={invoiceErrors.nip ? styles.inputError : ''}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Ulica i numer *</label>
              <input
                name="street"
                type="text"
                value={invoiceData.street}
                onChange={handleInvoiceChange}
                className={invoiceErrors.street ? styles.inputError : ''}
                disabled={!wantsInvoice}
              />
            </div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label>Kod pocztowy *</label>
                <input
                  name="postalCode"
                  type="text"
                  value={invoiceData.postalCode}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.postalCode ? styles.inputError : ''}
                  maxLength={6}
                  disabled={!wantsInvoice}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Miejscowość *</label>
                <input
                  name="city"
                  type="text"
                  value={invoiceData.city}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.city ? styles.inputError : ''}
                  disabled={!wantsInvoice}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionTitle}>Dane Gościa</div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="guestName">Imię i Nazwisko</label>
            <input id="guestName" name="guestName" type="text" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">Email</label>
            <input id="guestEmail" name="guestEmail" type="email" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Telefon</label>
            <input id="guestPhone" name="guestPhone" type="tel" required />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="internalNotes">Uwagi wewnętrzne</label>
          <textarea id="internalNotes" name="internalNotes" rows={3}></textarea>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={resetAll}>Anuluj</button>
          <button type="submit" className={styles.btnSubmit} disabled={isPending}>
            {isPending ? 'Zapisuję...' : 'Zapisz Rezerwację'}
          </button>
        </div>
      </form>
    </div>
  )
}