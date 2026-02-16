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
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [cabinsCount, setCabinsCount] = useState(1);
    const [bookingDates, setBookingDates] = useState<BookingDates>({
        start: null,
        end: null,
        count: 0
    });

    const handleDateChange = (dates: BookingDates) => {
        setBookingDates(dates);
    };

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
                        {adults} {adults > 1 ? 'dorosłych' : 'dorosły'}, {children} {((children > 1) || (children === 0)) ? 'dzieci' : 'dziecko'}
                    </div>
                    <div className={`${styles.setGests} ${isGestBoxOpen ? styles.expandedGests : ''}`}>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dorośli: </span>
                            <QuantityPicker
                                onIncrement={() => setAdults(adults + 1)}
                                onDecrement={() => setAdults(adults - 1)}
                                value={adults}
                                min={1}
                                max={6}
                            />
                        </div>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dzieci: </span>
                            <QuantityPicker
                                onIncrement={() => setChildren(children + 1)}
                                onDecrement={() => setChildren(children - 1)}
                                value={children}
                                min={0}
                                max={10}
                            />
                        </div>
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
                <button className={styles.button}> Szukaj </button>
            </div>
        </div>
    );
}