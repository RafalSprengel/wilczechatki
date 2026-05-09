import React, { useEffect, useMemo, useState } from 'react'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBed, faUser } from '@fortawesome/free-solid-svg-icons'
import { calculateTotalPrice } from '@/actions/searchActions'

interface CombinedOrderSelection {
  propertyId: string
  displayName: string
  guests: number
  extraBeds: number
  price: number
}

export default function AllPropertiesCard({ 
  searchResults, 
  extraBedsMap, 
  onExtraBedsChange,
  guestsMap,
  onGuestsChange,
  totalGuestsLimit,
  startDate,
  endDate,
  onSelectAll
}: { 
  searchResults: any, 
  extraBedsMap: Record<string, number>, 
  onExtraBedsChange: (displayName: string, value: number) => void,
  guestsMap: Record<string, number>,
  onGuestsChange: (displayName: string, value: number) => void,
  totalGuestsLimit: number,
  startDate: string | null,
  endDate: string | null,
  onSelectAll: (orders: CombinedOrderSelection[]) => void
}) {
  const [priceMap, setPriceMap] = useState<Record<string, number>>({})
  const [showGuestsValidation, setShowGuestsValidation] = useState(false)

  useEffect(() => {
    if (!startDate || !endDate || !searchResults?.propertiesAvailable?.length) {
      setPriceMap({})
      return
    }

    let isCancelled = false

    const recalculatePrices = async () => {
      const nextPriceEntries = await Promise.all(
        searchResults.propertiesAvailable.map(async (option: any) => {
          const guests = Math.max(1, guestsMap[option.displayName] || 1)
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

  const totalAssignedGuests = useMemo(
    () => searchResults.propertiesAvailable.reduce(
      (sum: number, option: any) => sum + Math.max(1, guestsMap[option.displayName] || 1),
      0
    ),
    [searchResults, guestsMap]
  )

  const canSelectAll = totalAssignedGuests === totalGuestsLimit && totalGuestsLimit > 0

  useEffect(() => {
    if (canSelectAll) {
      setShowGuestsValidation(false)
    }
  }, [canSelectAll])

  const handleSelectAllClick = () => {
    if (!canSelectAll) {
      setShowGuestsValidation(true)
      return
    }

    const orders: CombinedOrderSelection[] = searchResults.propertiesAvailable.map((option: any) => {
      const guests = Math.max(1, guestsMap[option.displayName] || 1)
      const extraBeds = extraBedsMap[option.displayName] || 0
      const price = priceMap[option.displayName]

      if (price === undefined) {
        throw new Error(`Brak ceny dla domku: ${option.displayName}`)
      }

      return {
        propertyId: option.propertyId,
        displayName: option.displayName,
        guests,
        extraBeds,
        price,
      }
    })

    onSelectAll(orders)
  }

  return (
    <div>
      <h2 className={styles.resultsTitle}>Rozdziel liczbę gości na poszczególne domki:</h2>
      <div className={`${styles.resultsGrid} ${styles.allPropertiesGridCard}`}>
        {searchResults.propertiesAvailable.map((option: any) => {
          const extraBeds = extraBedsMap[option.displayName] || 0
          const guests = Math.max(1, guestsMap[option.displayName] || 1)
          const canIncrementGuests = totalAssignedGuests < totalGuestsLimit

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
                  disableIncrement={!canIncrementGuests}
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
                  min={0}
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

        <div className={`${styles.extraBedsNote} ${showGuestsValidation && !canSelectAll ? styles.extraBedsNoteError : ''}`}>
          Przydzielono gości: <strong>{totalAssignedGuests}</strong> / {totalGuestsLimit}
        </div>

        {showGuestsValidation && !canSelectAll && (
          <div className={styles.allocationErrorText}>Najpierw rozdziel wszystkich gości</div>
        )}

        <button
          type="button"
          className={`${styles.btnSelect} ${!canSelectAll ? styles.btnSelectDisabledLook : ''}`}
          onClick={handleSelectAllClick}
          aria-disabled={!canSelectAll}
        >
          Wybieram tę opcję
        </button>
      </div>
    </div>
  )
}