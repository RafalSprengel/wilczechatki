import React, { useEffect, useMemo, useState } from 'react'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBed, faUser } from '@fortawesome/free-solid-svg-icons'
import { calculateTotalPrice } from '@/actions/searchActions'

export default function AllPropertiesCard({ 
  searchResults, 
  extraBedsMap, 
  onExtraBedsChange,
  guestsMap,
  onGuestsChange,
  startDate,
  endDate,
  onSelectAll
}: { 
  searchResults: any, 
  extraBedsMap: Record<string, number>, 
  onExtraBedsChange: (displayName: string, value: number) => void,
  guestsMap: Record<string, number>,
  onGuestsChange: (displayName: string, value: number) => void,
  startDate: string | null,
  endDate: string | null,
  onSelectAll: (totalPrice: number) => void
}) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!startDate || !endDate || !searchResults?.propertiesAvailable?.length) {
      setPriceMap({})
      return
    }

    let isCancelled = false

    const recalculatePrices = async () => {
      const nextPriceEntries = await Promise.all(
        searchResults.propertiesAvailable.map(async (option: any) => {
          const guests = guestsMap[option.displayName] || 0
          const extraBeds = extraBedsMap[option.displayName] || 0

          if (guests <= 0) {
            return [option.displayName, 0] as const
          }

          try {
            const totalPrice = await calculateTotalPrice({
              startDate,
              endDate,
              baseGuests: guests,
              extraBeds,
              propertySelection: option.propertyId,
            })
            return [option.displayName, totalPrice] as const
          } catch {
            const fallbackPrice = option.totalPrice + (extraBeds * option.extraBedPrice)
            return [option.displayName, fallbackPrice] as const
          }
        })
      )

      if (!isCancelled) {
        setPriceMap(Object.fromEntries(nextPriceEntries))
      }
    }

    recalculatePrices()

    return () => {
      isCancelled = true
    }
  }, [searchResults, guestsMap, extraBedsMap, startDate, endDate])

  const combinedTotalPrice = useMemo(
    () => Object.values(priceMap).reduce((sum, price) => sum + price, 0),
    [priceMap]
  )

  return (
    <div>
      <h2 className={styles.resultsTitle}>Rozdziel liczbę gości na poszczególne domki:</h2>
      <div className={`${styles.resultsGrid} ${styles.allPropertiesGridCard}`}>
        {searchResults.propertiesAvailable.map((option: any) => {
          const extraBeds = extraBedsMap[option.displayName] || 0
          const guests = guestsMap[option.displayName] || 0

          return (
            <div key={option.displayName} className={`${styles.resultCard} ${styles.allPropertiesResultCard}`}>
              <div className={styles.cardHeader}>
                <span className={`${styles.cardBadge} ${styles.badgeCabin}`}>
                  REZERWACJA ŁĄCZONA
                </span>
              </div>

              <h4 className={styles.cardTitle}>{option.displayName}</h4>

              {option.description && <p className={styles.cardDesc}>{option.description}</p>}

              <div className={styles.cardDetails}>
                <span>Pojemność: {option.maxGuests} osób</span>
                <span className={styles.separator}> • </span>
                <span>Max. dostawek: {option.maxExtraBeds}</span>
              </div>

              <div className={styles.extraBedsSection}>
                <div className={styles.extraBedsHeader}>
                  <FontAwesomeIcon icon={faUser} className={styles.bedIcon} />
                  <span className={styles.extraBedsLabel}>Ilość gości:</span>
                </div>
                <QuantityPicker
                  value={guests}
                  onIncrement={() => onGuestsChange(option.displayName, guests + 1)}
                  onDecrement={() => onGuestsChange(option.displayName, guests - 1)}
                  min={1}
                  max={option.maxGuests}
                />
              </div>

              <div className={styles.extraBedsSection}>
                <div className={styles.extraBedsHeader}>
                  <FontAwesomeIcon icon={faBed} className={styles.bedIcon} />
                  <span className={styles.extraBedsLabel}>Ilość dostawek:</span>
                </div>
                <QuantityPicker
                  value={extraBeds}
                  onIncrement={() => onExtraBedsChange(option.displayName, extraBeds + 1)}
                  onDecrement={() => onExtraBedsChange(option.displayName, extraBeds - 1)}
                  min={1}
                  max={option.maxExtraBeds}
                />
                <span className={styles.extraBedsPrice}>+{extraBeds * option.extraBedPrice} zł</span>
              </div>
            </div>
          )
        })}

        <div className={`${styles.cardPrice} ${styles.allPropertiesTotalPrice}`}>
          <span className={styles.priceLabel}>Cena całkowita:</span>
          <span className={styles.priceValue}>{combinedTotalPrice} zł</span>
        </div>

        <button
          type="button"
          className={styles.btnSelect}
          onClick={() => onSelectAll(combinedTotalPrice)}
        >
          Wybieram tę opcję
        </button>
      </div>
    </div>
  )
}