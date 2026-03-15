'use client';

import styles from './QuantityPicker.module.css';

interface QuantityPickerProps {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
    disableIncrement?: boolean;
}

export default function QuantityPicker({
    value,
    onIncrement,
    onDecrement,
    min = 0,
    max = 10,
    disableIncrement = false
}: QuantityPickerProps) {
    const isMaxReached = value >= max || disableIncrement;
    
    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button
                    type="button"
                    className={`${styles.button} ${value <= min ? styles.disabled : ''}`}
                    onClick={onDecrement}
                    disabled={value <= min}
                >
                    -
                </button>
                <span className={styles.value}>{value}</span>
                <button
                    type="button"
                    className={`${styles.button} ${isMaxReached ? styles.maxReached : ''}`}
                    onClick={onIncrement}
                    disabled={isMaxReached}
                >
                    +
                </button>
            </div>
        </div>
    );
}