'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { searchAction, SearchOption, getMaxTotalGuests } from '@/actions/searchActions'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import CalendarPicker from '../../_components/CalendarPicker/CalendarPicker'
import { useClickOutside } from '@/hooks/useClickOutside'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faSpinner, faExclamationCircle, faHouse, faBed, faArrowRight } from '@fortawesome/free-solid-svg-icons'

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
const EXTRA_BED_PRICE = 50

export default function BookingPage() {
  const router = useRouter()
  const [activeBox, setActiveBox] = useState<string | null>(null)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [maxTotalGuests, setMaxTotalGuests] = useState(12)
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchOption[] | null>(null)
  const [extraBedsMap, setExtraBedsMap] = useState<Record<string, number>>({})
  const [hasDraft, setHasDraft] = useState(false)
  
  const guestsRef = useRef<HTMLDivElement>(null)
  const datesRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const loadMaxGuests = async () => {
      const max = await getMaxTotalGuests();
      setMaxTotalGuests(max);
    };
    loadMaxGuests();
  }, []);
  
  useEffect(() => {
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
  
  const handleSearch = async () => {
    if (!bookingDates.start || !bookingDates.end || totalGuests === 0) return
    
    setIsLoading(true)
    setSearchResults(null)
    setExtraBedsMap({})
    
    try {
      const results = await searchAction({
        startDate: bookingDates.start,
        endDate: bookingDates.end,
        guests: totalGuests,
        extraBeds: 0
      })
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      alert('Wystąpił błąd podczas sprawdzania dostępności.')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleExtraBedsChange = (optionDisplayName: string, value: number) => {
    setExtraBedsMap(prev => ({
      ...prev,
      [optionDisplayName]: value
    }))
  }
  
  const getBasePrice = (option: SearchOption) => {
    return option.totalPrice
  }
  
  const getTotalPriceWithExtraBeds = (option: SearchOption) => {
    const extraBeds = extraBedsMap[option.displayName] || 0
    return option.totalPrice + (extraBeds * EXTRA_BED_PRICE)
  }
  
  const handleSelectOption = (option: SearchOption) => {
    const extraBeds = extraBedsMap[option.displayName] || 0
    const totalPriceWithExtraBeds = getTotalPriceWithExtraBeds(option)
    
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
          <Link href="/booking/details" className={styles.draftLink}>
            <span>➡️ Masz rozpoczętą rezerwację - kliknij aby kontynuować</span>
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
            <span className={styles.info}>* Dzieci do lat 13 bezpłatnie</span>
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
              unavailableDates={[]}
              onDateChange={setBookingDates}
            />
            <button className={styles.buttOk} onClick={closeAllBoxes}>Gotowe</button>
          </div>
        </div>
        
        <button
          className={styles.button}
          disabled={isSearchDisabled || isLoading}
          onClick={handleSearch}
        >
          {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Szukaj'}
        </button>
      </div>
      
      <div className={styles.resultsContainer}>
        {isLoading && (
          <div className={styles.loadingState}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinIcon} />
            <p>Sprawdzam dostępność domków...</p>
          </div>
        )}
        
        {!isLoading && searchResults !== null && searchResults.length === 0 && (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faExclamationCircle} className={styles.emptyIcon} />
            <h3>Brak wolnych terminów</h3>
            <p>Niestety dla wybranej liczby gości i dat nie mamy dostępnych domków.</p>
            <p>Spróbuj zmienić daty lub zmniejszyć liczbę osób.</p>
          </div>
        )}
        
        {!isLoading && searchResults !== null && searchResults.length > 0 && (
          <div className={styles.resultsGrid}>
            <h3 className={styles.resultsTitle}>
              Dostępne opcje ({searchResults.length})
            </h3>
            
            {searchResults.map((option) => {
              const extraBeds = extraBedsMap[option.displayName] || 0
              const totalPriceWithExtraBeds = getTotalPriceWithExtraBeds(option)
              
              return (
                <div key={option.displayName} className={styles.resultCard}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.cardBadge} ${option.type === 'whole' ? styles.badgeDouble : styles.badgeSingle}`}>
                      {option.type === 'whole' ? 'CAŁA POSESJA' : 'POJEDYNCZY DOMEK'}
                    </span>
                    {option.type === 'whole' && (
                      <span className={styles.privacyBadge}>Prywatny teren</span>
                    )}
                  </div>
                  
                  <h4 className={styles.cardTitle}>
                    {option.type === 'whole' ? (
                      <>
                        <FontAwesomeIcon icon={faHouse} className={styles.doubleIcon} />
                        &nbsp;{option.displayName}
                      </>
                    ) : option.displayName}
                  </h4>
                  
                  <p className={styles.cardDesc}>{option.description}</p>
                  
                  <div className={styles.cardDetails}>
                    <span>Pojemność: {option.maxGuests} osób</span>
                    <span className={styles.separator}> • </span>
                    <span>Max dostawek: {option.maxExtraBeds}</span>
                  </div>
                  
                  {option.maxExtraBeds > 0 && (
                    <div className={styles.extraBedsSection}>
                      <div className={styles.extraBedsHeader}>
                        <FontAwesomeIcon icon={faBed} className={styles.bedIcon} />
                        <span className={styles.extraBedsLabel}>Dodatkowe miejsca:</span>
                      </div>
                      <QuantityPicker
                        value={extraBeds}
                        onIncrement={() => handleExtraBedsChange(option.displayName, extraBeds + 1)}
                        onDecrement={() => handleExtraBedsChange(option.displayName, extraBeds - 1)}
                        min={0}
                        max={option.maxExtraBeds}
                      />
                      <span className={styles.extraBedsPrice}>+{extraBeds * EXTRA_BED_PRICE} zł</span>
                    </div>
                  )}
                  
                  <div className={styles.cardPrice}>
                    <span className={styles.priceLabel}>Cena całkowita:</span>
                    <span className={styles.priceValue}>{totalPriceWithExtraBeds} zł</span>
                  </div>
                  
                  <button
                    className={styles.btnSelect}
                    onClick={() => handleSelectOption(option)}
                    disabled={!option.available}
                  >
                    {option.available ? 'Wybieram tę opcję' : 'Niedostępne'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}