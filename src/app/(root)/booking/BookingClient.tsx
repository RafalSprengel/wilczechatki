'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchOption } from '@/actions/searchActions'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import CalendarPicker, { DatesData } from '../../_components/CalendarPicker/CalendarPicker'
import { useClickOutside } from '@/hooks/useClickOutside'
import ResultCard from './ResultCard'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faSpinner, faExclamationCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import AllPropertiesCard from './AllPropertiesCard'

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface BookingDraft {
  startDate: string
  endDate: string
  adults: number
  children: number
  extraBeds: number
  selectedOption: SearchOption | null
}

const STORAGE_KEY = 'wilczechatki_booking_draft'

interface BookingClientProps {
  initialStart: string | null
  initialEnd: string | null
  initialAdults: number
  initialChildren: number
  maxTotalGuests: number
  minBookingDays: number
  maxBookingDays: number
  childrenFreeAgeLimit: number
  blockedDates: { date: string }[]
  searchResults: { propertiesAvailable: SearchOption[]; areAllAvailable: boolean } | null
}

export default function BookingClient({
  initialStart,
  initialEnd,
  initialAdults,
  initialChildren,
  maxTotalGuests,
  minBookingDays,
  maxBookingDays,
  childrenFreeAgeLimit,
  blockedDates,
  searchResults
}: BookingClientProps) {
  const router = useRouter()

  const [activeBox, setActiveBox] = useState<string | null>(null)
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: initialStart,
    end: initialEnd,
    count: 0
  })

  const [isSearching, setIsSearching] = useState(false)
  const [extraBedsMap, setExtraBedsMap] = useState<Record<string, number>>({})
  const [guestsMap, setGuestsMap] = useState<Record<string, number>>({})
  const [hasDraft, setHasDraft] = useState(false)

  const guestsRef = useRef<HTMLDivElement>(null)
  const datesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsSearching(false)
  }, [searchResults])

  useEffect(() => {
    if (initialStart || initialEnd) {
      setBookingDates({
        start: initialStart,
        end: initialEnd,
        count: 0
      });
    }
  }, [initialStart, initialEnd]);

  useEffect(() => {
    const resultsGuests = initialAdults + initialChildren;
    const currentGuests = adults + children;

    if (resultsGuests > 0 && resultsGuests !== currentGuests) {
    }
  }, [adults, children, initialAdults, initialChildren]);

  useEffect(() => {  // po odswierzeniu wkłada daty do pola "wybierz terminy"
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.selectedOption) {
          setHasDraft(true)
        }
      } catch {
        setHasDraft(false)
      }
    }
  }, [])


  useClickOutside(guestsRef, () => {
    if (activeBox === 'guests') setActiveBox(null)
  })

  useClickOutside(datesRef, () => {
    if (activeBox === 'dates') setActiveBox(null)
  })

  const totalGuests = adults + children
  const atMaxGuests = totalGuests >= maxTotalGuests

  const toggleBox = (boxName: string) => {
    setActiveBox(activeBox === boxName ? null : boxName)
  }

  const closeAllBoxes = () => setActiveBox(null)

  const calendarDates: DatesData = {}
  blockedDates.forEach((bd) => {
    calendarDates[bd.date] = { available: false }
  })

  const handleSearch = () => {
    if (!bookingDates.start || !bookingDates.end || totalGuests === 0) return

    setIsSearching(true)
    setExtraBedsMap({})
    setGuestsMap({})
    closeAllBoxes()

    const params = new URLSearchParams()
    params.set('start', bookingDates.start)
    params.set('end', bookingDates.end)
    params.set('adults', adults.toString())
    params.set('children', children.toString())

    router.push(`/booking?${params.toString()}`)
  }

  const handleExtraBedsChange = (optionDisplayName: string, value: number) => {
    setExtraBedsMap(prev => ({
      ...prev,
      [optionDisplayName]: value
    }))
  }

  const handleGuestsChange = (optionDisplayName: string, value: number) => {
    setGuestsMap(prev => ({
      ...prev,
      [optionDisplayName]: value
    }))
  }

  const handleSelectOption = (option: SearchOption, totalPriceWithExtraBeds: number) => {

    const extraBeds = extraBedsMap[option.displayName] || 0

    const maxCapacity = option.maxGuests + extraBeds;
    if (totalGuests > maxCapacity) {
      alert(`Liczba osób (${totalGuests}) przekracza pojemność dla "${option.displayName}" (max ${maxCapacity}). Proszę wybrać inną opcję lub zmniejszyć liczbę osób.`);
      return;
    }

    const draft: BookingDraft = {
      startDate: bookingDates.start!,
      endDate: bookingDates.end!,
      adults,
      children,
      extraBeds,
      selectedOption: {
        ...option,
        totalPrice: totalPriceWithExtraBeds
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    router.push('/booking/details')
  }

  const handleSelectAllProperties = (combinedTotalPrice: number) => {
    const extraBeds = Object.values(extraBedsMap).reduce((sum, value) => sum + value, 0)

    const draft: BookingDraft = {
      startDate: bookingDates.start!,
      endDate: bookingDates.end!,
      adults,
      children,
      extraBeds,
      selectedOption: {
        propertyId: 'ALL_PROPERTIES',
        displayName: `Wszystkie domki (${searchResults?.propertiesAvailable?.length || 0})`,
        totalPrice: combinedTotalPrice,
        extraBedPrice: 0,
        maxGuests: 0,
        maxExtraBeds: 0,
        description: 'Rezerwacja łączona'
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    router.push('/booking/details')
  }

  const renderGuestsText = () => {
    if (totalGuests === 0) return 'Wybierz ilość osób'
    const adultsText = adults === 1 ? '1 dorosły' : `${adults} dorosłych`
    const childrenText = children === 0 ? '' : children === 1 ? ', 1 dziecko' : `, ${children} dzieci`
    return `${adultsText}${childrenText}`
  }

  const isSearchDisabled = totalGuests === 0 || !bookingDates.start || !bookingDates.end
  return (
    <div className={styles.container}>
      {hasDraft && (
        <div className={styles.draftLinkContainer}>
          <button
            className={styles.draftClearBtn}
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              setHasDraft(false)
            }}
            aria-label="Usuń szkic rezerwacji"
          >
            ✕
          </button>
          <Link href="/booking/details" className={styles.draftLink}>
            <span>Kliknij aby dokończyć poprzednią rezerwację</span>
            <FontAwesomeIcon icon={faArrowRight} className={styles.draftArrow} />
          </Link>
        </div>
      )}

      <div className={styles.head}>
        <h2>Znajdź swój termin</h2>
      </div>

      <div className={styles.searchBox}>
        <div className={styles.gestsBox}>
          <div className={styles.gests} onClick={() => toggleBox('guests')}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faUsers} className={styles.iconSmall} />
              <span>{renderGuestsText()}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>&#9662;</span>
          </div>

          <div
            ref={guestsRef}
            className={`${styles.setGests} ${activeBox === 'guests' ? styles.expandedGests : ''}`}
          >
            <div className={styles.pickerWrap}>
              <span className={styles.label}>Dorośli:</span>
              <QuantityPicker
                onIncrement={() => setAdults(adults + 1)}
                onDecrement={() => setAdults(adults > 0 ? adults - 1 : 0)}
                value={adults}
                min={0}
                max={maxTotalGuests}
                disableIncrement={atMaxGuests}
              />
            </div>
            <div className={styles.pickerWrap}>
              <span className={styles.label}>Dzieci:</span>
              <QuantityPicker
                onIncrement={() => setChildren(children + 1)}
                onDecrement={() => setChildren(children > 0 ? children - 1 : 0)}
                value={children}
                min={0}
                max={maxTotalGuests}
                disableIncrement={atMaxGuests}
              />
            </div>
            <span className={styles.info}>* Dzieci do lat {childrenFreeAgeLimit} bezpłatnie</span>
            <button className={styles.buttOk} onClick={closeAllBoxes}>Gotowe</button>
          </div>
        </div>

        <div className={styles.dateBox}>
          <div className={styles.date} onClick={() => toggleBox('dates')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>
                {bookingDates.start && bookingDates.end
                  ? `${bookingDates.start} — ${bookingDates.end}`
                  : 'Wybierz daty'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>&#9662;</span>
            </div>
          </div>

          <div
            ref={datesRef}
            className={`${styles.setDate} ${activeBox === 'dates' ? styles.expandedDate : ''}`}
          >
            <CalendarPicker
              dates={calendarDates}
              onDateChange={setBookingDates}
              minBookingDays={minBookingDays}
              maxBookingDays={maxBookingDays}
            />
            <button className={styles.buttOk} onClick={closeAllBoxes}>Gotowe</button>
          </div>
        </div>

        <button
          className={styles.button}
          disabled={isSearchDisabled || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Szukaj'}
        </button>
      </div>

      <div className={styles.resultsContainer}>
        {isSearching && (
          <div className={styles.loadingState}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinIcon} />
            <p>Sprawdzam dostępność domków...</p>
          </div>
        )}

        {(adults + children !== initialAdults + initialChildren || bookingDates.start !== initialStart || bookingDates.end !== initialEnd) && searchResults && searchResults.propertiesAvailable !== null && (
          <div className={styles.emptyState}>
            {adults + children !== initialAdults + initialChildren && (
              <p>Zmieniłeś liczbę osób z {initialAdults + initialChildren} na {adults + children}.</p>
            )}
            {(bookingDates.start !== initialStart || bookingDates.end !== initialEnd) && (
              <p>Zmieniłeś wyszukiwane daty.</p>
            )}
            <p>Kliknij "Szukaj" ponownie, aby odświeżyć wyniki.</p>
          </div>
        )}

        {!isSearching && searchResults && searchResults.propertiesAvailable !== null && adults + children === initialAdults + initialChildren && bookingDates.start === initialStart && bookingDates.end === initialEnd && (
          <>
            {(() => {
              if (searchResults?.propertiesAvailable.length === 0) {
                return (
                  <div className={styles.emptyState}>
                    <FontAwesomeIcon icon={faExclamationCircle} className={styles.emptyIcon} />
                    <h3>Brak wolnych terminów</h3>
                    <p>Niestety dla wybranej liczby gości i dat nie mamy dostępnych domków.</p>
                    <p>Spróbuj zmienić daty lub zmniejszyć liczbę osób.</p>
                  </div>
                )
              }
              return (
                <div className={styles.resultsGrid}>
                  <h3 className={styles.resultsTitle}>
                    Dostępne opcje ({searchResults.propertiesAvailable.length})
                  </h3>
                  {searchResults.propertiesAvailable.map((option) => (
                    <ResultCard
                      key={option.displayName}
                      option={option}
                      extraBeds={extraBedsMap[option.displayName] || 0}
                      onExtraBedsChange={handleExtraBedsChange}
                      onSelect={handleSelectOption}
                    />
                  ))}
                  {searchResults.areAllAvailable && (
                    <div className={styles.allAvailableNote}>
                      <h3>Zarezerwuj {searchResults.propertiesAvailable.length} domki teraz</h3>
                      <AllPropertiesCard
                        searchResults={searchResults}
                        extraBedsMap={extraBedsMap}
                        onExtraBedsChange={handleExtraBedsChange}
                        guestsMap={guestsMap}
                        onGuestsChange={handleGuestsChange}
                        startDate={bookingDates.start}
                        endDate={bookingDates.end}
                        onSelectAll={handleSelectAllProperties}
                      />
                    </div>
                  )}

                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}