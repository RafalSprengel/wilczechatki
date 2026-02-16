'use client'

import React, { useState } from 'react';
import QuantityPicker from '../_components/QuantityPicker/QuantityPicker';
import CalendarPicker from '../_components/CalendarPicker/CalendarPicker';
import styles from "./page.module.css";

interface BookingDates {
    start: string | null;
    end: string | null;
    count: number;
}

export default function Booking() {
    const [isDateBoxOpen, setIsDateBoxOpen] = useState(false);
    const [isGestBoxOpen, setIsGestBoxOpen] = useState(false);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);

    const handleDateChange = (dates: BookingDates) => {
        console.log(dates);
    };

    return (
        <div className={styles.container}>
            <div className={styles.head}>
                <h2>Rezerwacje</h2>
            </div>
            <div className={styles.searchBox}>
                <div className={styles.dateBox}>
                    <div className={styles.date} onClick={() => setIsDateBoxOpen(!isDateBoxOpen)}>
                        12 lutego 2026 - 18 lutego 2026 (6 nocy)
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
                                max={10}
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
                <button className={styles.button}> Szukaj </button>
            </div>
        </div>
    );
}