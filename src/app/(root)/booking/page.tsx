'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { searchAction, SearchOption } from '@/actions/searchActions'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import CalendarPicker from '../../_components/CalendarPicker/CalendarPicker'
import { useClickOutside } from '@/hooks/useClickOutside'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faSpinner, faExclamationCircle, faHouse } from '@fortawesome/free-solid-svg-icons'

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

export default function BookingPage() {
    const router = useRouter()
    const [activeBox, setActiveBox] = useState<string | null>(null)
    const [adults, setAdults] = useState(2)
    const [children, setChildren] = useState(0)
    const [bookingDates, setBookingDates] = useState<BookingDates>({
        start: null,
        end: null,
        count: 0
    })
    const [isLoading, setIsLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchOption[] | null>(null)

    const guestsRef = useRef<HTMLDivElement>(null)
    const datesRef = useRef<HTMLDivElement>(null)

    useClickOutside(guestsRef, () => {
        if (activeBox === 'guests') setActiveBox(null)
    })

    useClickOutside(datesRef, () => {
        if (activeBox === 'dates') setActiveBox(null)
    })

    const totalGuests = adults + children

    const toggleBox = (boxName: string) => {
        setActiveBox(activeBox === boxName ? null : boxName)
    }

    const closeAllBoxes = () => setActiveBox(null)

    const handleSearch = async () => {
        if (!bookingDates.start || !bookingDates.end || totalGuests === 0) return

        setIsLoading(true)
        setSearchResults(null)

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

    const handleSelectOption = (option: SearchOption) => {
        const draft: BookingDraft = {
            startDate: bookingDates.start!,
            endDate: bookingDates.end!,
            adults,
            children,
            extraBeds: 0,
            selectedOption: option
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
                                max={12}
                            />
                        </div>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dzieci:</span>
                            <QuantityPicker
                                onIncrement={() => setChildren(children + 1)}
                                onDecrement={() => setChildren(children > 0 ? children - 1 : 0)}
                                value={children}
                                min={0}
                                max={12}
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

                        {searchResults.map((option, index) => (
                            <div key={`${option.displayName}-${index}`} className={styles.resultCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.cardBadge} ${option.type === 'double' ? styles.badgeDouble : styles.badgeSingle}`}>
                                        {option.type === 'double' ? 'CAŁA POSESJA' : 'POJEDYNCZY DOMEK'}
                                    </span>
                                    {option.type === 'double' && (
                                        <span className={styles.privacyBadge}>Prywatny teren</span>
                                    )}
                                </div>

                                <h4 className={styles.cardTitle}>
                                    {option.type === 'double' ? (
                                        <>
                                            <FontAwesomeIcon icon={faHouse} className={styles.doubleIcon} />
                                            &nbsp;{option.displayName}
                                        </>
                                    ) : option.displayName}
                                </h4>

                                <p className={styles.cardDesc}>{option.description}</p>

                                <div className={styles.cardDetails}>
                                    <span>Maks. {option.maxGuests} osób</span>
                                </div>

                                <div className={styles.cardPrice}>
                                    <span className={styles.priceLabel}>Cena za całość:</span>
                                    <span className={styles.priceValue}>{option.totalPrice} zł</span>
                                </div>

                                <button
                                    className={styles.btnSelect}
                                    onClick={() => handleSelectOption(option)}
                                >
                                    Wybieram tę opcję
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}