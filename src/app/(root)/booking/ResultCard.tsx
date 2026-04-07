'use client'

import React from 'react'
import { SearchOption } from '@/actions/searchActions'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faBed } from '@fortawesome/free-solid-svg-icons'

const EXTRA_BED_PRICE = 50

interface ResultCardProps {
  option: SearchOption
  extraBeds: number
  onExtraBedsChange: (displayName: string, value: number) => void
  onSelect: (option: SearchOption, totalPrice: number) => void
}

export default function ResultCard({
  option,
  extraBeds,
  onExtraBedsChange,
  onSelect
}: ResultCardProps) {
  const totalPriceWithExtraBeds = option.totalPrice + (extraBeds * EXTRA_BED_PRICE)

  return (
    <div className={styles.resultCard}>
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
        <span>Max. dostawek: {option.maxExtraBeds}</span>
      </div>

      {option.maxExtraBeds > 0 && (
        <div className={styles.extraBedsSection}>
          <div className={styles.extraBedsHeader}>
            <FontAwesomeIcon icon={faBed} className={styles.bedIcon} />
            <span className={styles.extraBedsLabel}>Ilość dostawek:</span>
          </div>
          <QuantityPicker
            value={extraBeds}
            onIncrement={() => onExtraBedsChange(option.displayName, extraBeds + 1)}
            onDecrement={() => onExtraBedsChange(option.displayName, extraBeds - 1)}
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
        onClick={() => onSelect(option, totalPriceWithExtraBeds)}
      >
        Wybieram tę opcję
      </button>
    </div>
  )
}