'use client'

import React, { useState } from 'react';
import QuantityPicker from '@components/QuantityPicker/QuantityPicker';
import CalendarPicker from '../_components/CalendarPicker/CalendarPicker';
import styles from "./page.module.css";

export default function Booking() {
    const [isDateBoxOpen, setIsDateBoxOpen] = useState(false);
    const [isGestBoxOpen, setIsGestBoxOpen] = useState(false);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0)

    const toggleDateBox = () => {
        setIsDateBoxOpen(!isDateBoxOpen);
    };

    const toggleGestBox = () => {
        setIsGestBoxOpen(!isGestBoxOpen);
    };


    return (
        <div className={styles.container}>
            <div className={styles.head}>
                <h2>Rezerwacje</h2>
            </div>
            <div className={styles.searchBox}>
                <div className={styles.dateBox}>
                    <div className={styles.date} onClick={toggleDateBox}>
                        12 lutego 2026 - 18 lutego 2026 (6 nocy)
                    </div>
                    <div className={`${styles.setDate} ${isDateBoxOpen ? styles.expanded : ''}`}>
                        <CalendarPicker />
                        <button className={styles.buttOk} onClick={() => setIsDateBoxOpen(false)} >Gotowe</button>
                    </div>
                </div>
                <div className={styles.gestsBox}>
                    <div className={styles.gests} onClick={toggleGestBox}>
                        {adults} {adults > 1 ? 'dorosłych' : 'dorosły'}, {children} {children > 1 ? 'dzieci' : 'dziecko'}
                    </div>
                    <div className={`${styles.setGests} ${isGestBoxOpen ? styles.expanded : ''}`}>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dorośli: </span>
                            <span>
                                <QuantityPicker
                                    onIncrement={() => setAdults(adults + 1)}
                                    onDecrement={() => setAdults(adults - 1)}
                                    value={adults}
                                    min={0}
                                    max={10}
                                />
                            </span>
                        </div>
                        <div className={styles.pickerWrap}>
                            <span className={styles.label}>Dzieci: </span>
                            <span>
                                <QuantityPicker
                                    onIncrement={() => setChildren(children + 1)}
                                    onDecrement={() => setChildren(children - 1)}
                                    value={children}
                                    min={0}
                                    max={10}
                                />
                            </span>
                        </div>
                        <button className={styles.buttOk} onClick={() => setIsGestBoxOpen(false)} >Gotowe</button>
                    </div>
                </div>
                <button className={styles.button}> Szukaj </button>
            </div>
        </div>
    )
}