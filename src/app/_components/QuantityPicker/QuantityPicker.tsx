'use client';

import styles from './QuantityPicker.module.css';

interface QuantityPickerProps {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
}

export default function QuantityPicker({
    value,
    onIncrement,
    onDecrement,
    min = 0,
    max = 10
}: QuantityPickerProps) {
    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={onDecrement}
                    disabled={value <= min}
                >
                    -
                </button>
                <span className={styles.value}>{value}</span>
                <button
                    type="button"
                    className={styles.button}
                    onClick={onIncrement}
                    disabled={value >= max}
                >
                    +
                </button>
            </div>
        </div>
    );
}