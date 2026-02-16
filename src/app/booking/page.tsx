'use client'

import React, { useEffect, useState } from 'react';
import QuantityPicker from '../_components/QuantityPicker/QuantityPicker';
import CalendarPicker from '../_components/CalendarPicker/CalendarPicker';
import styles from "./page.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faCheck } from '@fortawesome/free-solid-svg-icons';

interface BookingDates {
    start: string | null;
    end: string | null;
    count: number;
}

export default function Booking() {
    const [isDateBoxOpen, setIsDateBoxOpen] = useState(false);
    const [isGestBoxOpen, setIsGestBoxOpen] = useState(false);
    const [isCabinsBoxOpen, setIsCabinsBoxOpen] = useState(false);
    const [adults, setAdults] = useState(0);
    const [children, setChildren] = useState(0);
    const [cabinsCount, setCabinsCount] = useState(1);
    const [bookingDates, setBookingDates] = useState<BookingDates>({
        start: null,
        end: null,
        count: 0
    });

    const maxGuestsPerCabin = 6;
    const maxGuest = maxGuestsPerCabin * cabinsCount;

    useEffect(() => {
        if (adults + children > maxGuest) {
            setAdults(0);
            setChildren(0);
        }
    }, [cabinsCount, maxGuest, adults, children]);

    const handleDateChange = (dates: BookingDates) => {
        setBookingDates(dates);
    };

    const renderGuestsText = () => {
        if (adults === 0 && children === 0) {
            return 'Wybierz ilość osób';
        }
        
        const adultsText = adults === 1 ? '1 dorosły' : `${adults} dorosłych`;
        const childrenText = children === 0 ? '' : (children === 1 ? ', 1 dziecko' : `, ${children} dzieci`);
        
        return `${adultsText}${childrenText}`;
    };

    const isSearchDisabled = adults === 0 || !bookingDates.start || !bookingDates.end;

    return (
        <div className={styles.container}>
            <div className={styles.head}>
                <h2>Rezerwacje</h2>
            </div>
            <div className={styles.searchBox}>
                <div className={styles.dateBox}>
                    <div className={styles.date} onClick={() => setIsDateBoxOpen(!isDateBoxOpen)}>
                        {(bookingDates.start && bookingDates.end) ? `od ${bookingDates.start} do ${bookingDates.end} (${bookingDates.count} dni)` : 'Wybierz datę'}
                    </div>
                    <div className={`${styles.setDate} ${isDateBoxOpen ? styles.expandedDate : ''}`}>
                        <CalendarPicker
                            unavailableDates={[]}
                            onDateChange={handleDateChange}
                        />
                        <button className={styles.buttOk} onClick={() => setIsDateBoxOpen(false)}>Gotowe</button>
                    </div>
                </div>

                <div className={styles.gestsBox}>
                    <div className={styles.gests} onClick={() => setIsGestBoxOpen(!isGestBoxOpen)}>
                        {renderGuestsText()}
                    </div>
                    <div className={`${styles.setGests} ${isGestBoxOpen ? styles.expandedGests : ''}`}>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dorośli: </span>
                            <QuantityPicker
                                onIncrement={() => setAdults(adults + 1)}
                                onDecrement={() => setAdults(adults - 1)}
                                value={adults}
                                min={0}
                                max={maxGuest - children}
                            />
                        </div>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dzieci: </span>
                            <QuantityPicker
                                onIncrement={() => setChildren(children + 1)}
                                onDecrement={() => setChildren(children - 1)}
                                value={children}
                                min={0}
                                max={maxGuest - adults}
                            />
                        </div>
                        <span className={styles.info}>* Maxymalnie do 6 osób na domek</span>
                        <button className={styles.buttOk} onClick={() => setIsGestBoxOpen(false)}>Gotowe</button>
                    </div>
                </div>

                <div className={styles.cabinsBox}>
                    <div className={styles.cabins} onClick={() => setIsCabinsBoxOpen(!isCabinsBoxOpen)}>
                        {cabinsCount === 1 ? '1 domek' : '2 domki'}
                    </div>
                    <div className={`${styles.setCabins} ${isCabinsBoxOpen ? styles.expandedCabins : ''}`}>
                        <div className={styles.cabinsSelection}>
                            <label className={styles.cabinOption}>
                                <input 
                                    type="radio" 
                                    name="cabins" 
                                    checked={cabinsCount === 1} 
                                    onChange={() => setCabinsCount(1)} 
                                />
                                <div className={styles.cabinVisual}>
                                    <div className={styles.iconStack}>
                                        <FontAwesomeIcon icon={faHouse} className={styles.cabinIcon} />
                                    </div>
                                    <div className={styles.tickBox}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </div>
                                    <span>1 Domek</span>
                                </div>
                            </label>

                            <label className={styles.cabinOption}>
                                <input 
                                    type="radio" 
                                    name="cabins" 
                                    checked={cabinsCount === 2} 
                                    onChange={() => setCabinsCount(2)} 
                                />
                                <div className={styles.cabinVisual}>
                                    <div className={styles.iconStack}>
                                        <FontAwesomeIcon icon={faHouse} className={styles.cabinIcon} />
                                        <FontAwesomeIcon icon={faHouse} className={`${styles.cabinIcon} ${styles.offsetIcon}`} />
                                    </div>
                                    <div className={styles.tickBox}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </div>
                                    <span>2 Domki</span>
                                </div>
                            </label>
                        </div>
                        <button className={styles.buttOk} onClick={() => setIsCabinsBoxOpen(false)}>Gotowe</button>
                    </div>
                </div>
                <button 
                    className={styles.button} 
                    disabled={isSearchDisabled}
                    style={{ 
                        opacity: isSearchDisabled ? 0.5 : 1, 
                        cursor: isSearchDisabled ? 'not-allowed' : 'pointer' 
                    }}
                > 
                    Szukaj 
                </button>
            </div>
        </div>
    );
}