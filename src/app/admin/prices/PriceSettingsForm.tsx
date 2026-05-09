'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  updateBasicPrices,
  updateSeasonPricesForProperty,
  getPricesForProperty,
  copyPricesToAllProperties,
} from '@/actions/seasonActions'
import {
  updateCustompriceForDate,
  getCustomPrices,
  deleteCustomPricesForDate,
} from '@/actions/priceConfigActions'
import CalendarPicker, { DatesData } from '@/app/_components/CalendarPicker/CalendarPicker'
import dayjs from 'dayjs'
import Modal from '@/app/_components/Modal/Modal'
import { formatDisplayDate } from '@/utils/formatDate'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import '../settings/settings.css'
import styles from './page.module.scss'

interface PropertyOption {
  _id: string
  name: string
  baseCapacity: number
  maxExtraBeds: number
}

interface PriceTier {
  minGuests: number
  maxGuests: number
  price: number
}

interface BookingDates {
  start: string | null
  end: string | null
  count: number
}

interface CustomPriceEntry {
  date: string
  prices: PriceTier[]
  previewPrice: number
  propertyId: string
  extraBedPrice?: number
}

interface Season {
  _id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  order: number
}

interface Props {
  properties: PropertyOption[]
  childrenFreeAgeLimit: number
  seasons: Season[]
}

const OFF_SEASON_ID = 'off-season'
const DEFAULT_CUSTOM_TIERS: PriceTier[] = [{ minGuests: 1, maxGuests: 2, price: 350 }]
const DEFAULT_CUSTOM_EXTRA_BED_PRICE = 100

type TierField = keyof PriceTier

interface TierValidationError {
  index: number
  fields: TierField[]
  message: string
}

function normalizeAndValidateTiers(
  tiers: PriceTier[],
  label: 'weekday' | 'weekend' | 'custom'
): {
  isValid: boolean
  sorted: PriceTier[]
  message?: string
  errors?: TierValidationError[]
} {
  if (tiers.length === 0) {
    return {
      isValid: false,
      sorted: [],
      message:
        label === 'weekday'
          ? 'Dodaj przynajmniej jeden przedzial dla dni powszednich.'
          : label === 'weekend'
            ? 'Dodaj przynajmniej jeden przedzial dla weekendu.'
            : 'Dodaj przynajmniej jeden przedział dla cen indywidualnych.',
    }
  }

  const sorted = [...tiers].sort((a, b) => a.minGuests - b.minGuests)

  for (let i = 0; i < sorted.length; i += 1) {
    const tier = sorted[i]

    if (
      !Number.isInteger(tier.minGuests) ||
      !Number.isInteger(tier.maxGuests) ||
      !Number.isInteger(tier.price)
    ) {
      return {
        isValid: false,
        sorted,
        message: 'Wszystkie pola przedzialow musza byc liczbami calkowitymi.',
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests', 'price'],
            message: 'Wszystkie pola musza byc liczbami calkowitymi.',
          },
        ],
      }
    }

    if (tier.minGuests < 1 || tier.maxGuests < 1) {
      return {
        isValid: false,
        sorted,
        message: 'Zakres gosci musi zaczynac sie od co najmniej 1 osoby.',
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests'],
            message: 'Pole Od i Do musi miec wartosc co najmniej 1.',
          },
        ],
      }
    }

    if (tier.minGuests > tier.maxGuests) {
      return {
        isValid: false,
        sorted,
        message: `Nieprawidlowy przedzial: od ${tier.minGuests} do ${tier.maxGuests}.`,
        errors: [
          {
            index: i,
            fields: ['minGuests', 'maxGuests'],
            message: 'Wartosc Od nie moze byc wieksza niz Do.',
          },
        ],
      }
    }

    if (tier.price < 0) {
      return {
        isValid: false,
        sorted,
        message: 'Cena nie moze byc ujemna.',
        errors: [
          {
            index: i,
            fields: ['price'],
            message: 'Cena nie moze byc ujemna.',
          },
        ],
      }
    }

    if (i > 0) {
      const prev = sorted[i - 1]
      if (tier.minGuests <= prev.maxGuests) {
        return {
          isValid: false,
          sorted,
          message: `Przedzialy nakladaja sie: ${prev.minGuests}-${prev.maxGuests} i ${tier.minGuests}-${tier.maxGuests}.`,
          errors: [
            {
              index: i - 1,
              fields: ['maxGuests'],
              message: 'Ten zakres nachodzi na kolejny przedzial.',
            },
            {
              index: i,
              fields: ['minGuests'],
              message: 'Ten zakres nachodzi na poprzedni przedzial.',
            },
          ],
        }
      }
    }
  }

  return { isValid: true, sorted }
}

export default function PriceSettingsForm({
  properties,
  childrenFreeAgeLimit,
  seasons,
}: Props) {
  // ── Selekcja ────────────────────────────────────────────────────────────────
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(OFF_SEASON_ID)

  // ── Formularz cen ───────────────────────────────────────────────────────────
  const [weekdayTiers, setWeekdayTiers] = useState<PriceTier[]>([])
  const [weekendTiers, setWeekendTiers] = useState<PriceTier[]>([])
  const [weekdayExtraBedPrice, setWeekdayExtraBedPrice] = useState<number>(50)
  const [weekendExtraBedPrice, setWeekendExtraBedPrice] = useState<number>(70)

  // ── Ceny indywidualne (per data) ────────────────────────────────────────────
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  })
  const [customTiers, setCustomTiers] = useState<PriceTier[]>([...DEFAULT_CUSTOM_TIERS])
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customExtraBedPrice, setCustomExtraBedPrice] = useState<number>(DEFAULT_CUSTOM_EXTRA_BED_PRICE)
  const [calendarPrices, setCalendarPrices] = useState<Record<string, number>>({})
  const [isCustomRangeMode, setIsCustomRangeMode] = useState(true)
  const [customTierErrors, setCustomTierErrors] = useState<TierValidationError[]>([])

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingCustom, setIsDeletingCustom] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false)
  const [isCustomPricesExpanded, setIsCustomPricesExpanded] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [isLoadingCustomPrices, setIsLoadingCustomPrices] = useState(false)
  const [isSeasonDirty, setIsSeasonDirty] = useState(false)
  const [isCustomDirty, setIsCustomDirty] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'weekday' | 'weekend' | null
    index: number | null
  }>({ isOpen: false, type: null, index: null })
  const [isRemovingTier, setIsRemovingTier] = useState(false)
  const [tierErrors, setTierErrors] = useState<{
    weekday: TierValidationError[]
    weekend: TierValidationError[]
  }>({ weekday: [], weekend: [] })
  const [deleteCustomModal, setDeleteCustomModal] = useState<{ isOpen: boolean; date: string | null }>({ isOpen: false, date: null })
  const [isDeletingCustomSingle, setIsDeletingCustomSingle] = useState(false)

  const loadSeasonPrices = useCallback(async () => {
    if (!selectedPropertyId) return

    setIsLoadingPrices(true)
    try {
      // Jedno zapytanie – wszystkie rekordy dla domku
      const allPrices = await getPricesForProperty(selectedPropertyId)

      // seasonId === null → basicPrices
      const basicPrices = allPrices.find(
        (p: any) => p.seasonId === null || p.seasonId === undefined
      )

      // Mapa sezonowa
      const seasonMap = new Map<string, any>(
        allPrices
          .filter((p: any) => p.seasonId != null)
          .map((p: any) => [p.seasonId, p])
      )

      if (selectedSeasonId === OFF_SEASON_ID) {
        if (basicPrices) {
          setWeekdayTiers(basicPrices.weekdayPrices ?? [])
          setWeekendTiers(basicPrices.weekendPrices ?? [])
          setWeekdayExtraBedPrice(basicPrices.weekdayExtraBedPrice ?? 50)
          setWeekendExtraBedPrice(basicPrices.weekendExtraBedPrice ?? 70)
        } else {
          setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
          setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
          setWeekdayExtraBedPrice(50)
          setWeekendExtraBedPrice(70)
        }
      } else {
        const seasonPrices = seasonMap.get(selectedSeasonId)
        if (seasonPrices) {
          setWeekdayTiers(seasonPrices.weekdayPrices ?? [])
          setWeekendTiers(seasonPrices.weekendPrices ?? [])
          setWeekdayExtraBedPrice(seasonPrices.weekdayExtraBedPrice ?? 50)
          setWeekendExtraBedPrice(seasonPrices.weekendExtraBedPrice ?? 70)
        } else {
          setWeekdayTiers([{ minGuests: 1, maxGuests: 3, price: 300 }])
          setWeekendTiers([{ minGuests: 1, maxGuests: 3, price: 400 }])
          setWeekdayExtraBedPrice(50)
          setWeekendExtraBedPrice(70)
        }
      }
      setTierErrors({ weekday: [], weekend: [] })
      setIsSeasonDirty(false)
    } catch (err) {
      console.error('Błąd ładowania cen:', err)
      toast.error('Nie udało się załadować cen')
    } finally {
      setIsLoadingPrices(false)
    }
  }, [selectedPropertyId, selectedSeasonId])

  // ── Ładuj ceny z PropertyPrices gdy zmieni się domek lub sezon ───────────────
  useEffect(() => {
    loadSeasonPrices()
  }, [loadSeasonPrices])

  // ── Ładuj custom prices gdy zmieni się domek ─────────────────────────────────
  useEffect(() => {
    if (!selectedPropertyId) return

    const loadCustomPrices = async () => {
      setIsLoadingCustomPrices(true)
      try {
        const prices = await getCustomPrices(selectedPropertyId)
        setCustomPrices(prices)
        setIsCustomDirty(false)
        const priceMap: Record<string, number> = {}
        prices.forEach((p) => {
          priceMap[p.date] = p.previewPrice
        })
        setCalendarPrices(priceMap)
      } finally {
        setIsLoadingCustomPrices(false)
      }
    }
    loadCustomPrices()
  }, [selectedPropertyId])

  const calendarDates = useMemo(() => {
    const dates: DatesData = {}
    Object.entries(calendarPrices).forEach(([date, price]) => {
      dates[date] = { price, available: true }
    })
    return dates
  }, [calendarPrices])

  // ── Handlers przedziałów cenowych ────────────────────────────────────────────

  const handleBaseRateChange = (
    type: 'weekday' | 'weekend',
    index: number,
    field: keyof PriceTier,
    value: number
  ) => {
    const setter = type === 'weekend' ? setWeekendTiers : setWeekdayTiers
    setIsSeasonDirty(true)
    setTierErrors((prev) => ({ ...prev, [type]: [] }))
    setter((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addTier = (type: 'weekday' | 'weekend') => {
    const tiers = type === 'weekend' ? weekendTiers : weekdayTiers
    const setter = type === 'weekend' ? setWeekendTiers : setWeekdayTiers

    setIsSeasonDirty(true)
    if (tiers.length === 0) {
      setTierErrors((prev) => ({ ...prev, [type]: [] }))
      setter([{ minGuests: 1, maxGuests: 3, price: type === 'weekend' ? 400 : 300 }])
      return
    }

    const last = tiers[tiers.length - 1]
    setTierErrors((prev) => ({ ...prev, [type]: [] }))
    setter((prev) => [
      ...prev,
      { minGuests: last.maxGuests + 1, maxGuests: last.maxGuests + 2, price: last.price + 100 },
    ])
  }

  const requestRemoveTier = (type: 'weekday' | 'weekend', index: number) => {
    setDeleteModal({ isOpen: true, type, index })
  }

  const confirmRemoveTier = async () => {
    if (!deleteModal.type || deleteModal.index === null) return

    const removeType = deleteModal.type
    const removeIndex = deleteModal.index

    const nextWeekdayTiers =
      removeType === 'weekday'
        ? weekdayTiers.filter((_, i) => i !== removeIndex)
        : weekdayTiers
    const nextWeekendTiers =
      removeType === 'weekend'
        ? weekendTiers.filter((_, i) => i !== removeIndex)
        : weekendTiers

    setIsRemovingTier(true)
    setTierErrors((prev) => ({ ...prev, [removeType]: [] }))

    try {
      const saved = await handleSavePrices({
        weekdayTiersOverride: nextWeekdayTiers,
        weekendTiersOverride: nextWeekendTiers,
      })
      if (saved) {
        setDeleteModal({ isOpen: false, type: null, index: null })
      }
    } finally {
      setIsRemovingTier(false)
    }
  }

  const getTierError = (type: 'weekday' | 'weekend', index: number) =>
    tierErrors[type].find((error) => error.index === index)

  // ── Zapis cen sezonowych/basic ───────────────────────────────────────────────

  const handleSavePrices = async (overrides?: {
    weekdayTiersOverride?: PriceTier[]
    weekendTiersOverride?: PriceTier[]
  }): Promise<boolean> => {
    if (!selectedPropertyId) {
      toast.error('Wybierz domek')
      return false
    }

    const weekdayTiersToSave =
      overrides && overrides.weekdayTiersOverride
        ? overrides.weekdayTiersOverride
        : weekdayTiers
    const weekendTiersToSave =
      overrides && overrides.weekendTiersOverride
        ? overrides.weekendTiersOverride
        : weekendTiers

    const weekdayValidation = normalizeAndValidateTiers(weekdayTiersToSave, 'weekday')
    if (!weekdayValidation.isValid) {
      setWeekdayTiers(weekdayValidation.sorted)
      setTierErrors((prev) => ({
        ...prev,
        weekday: weekdayValidation.errors ?? [],
      }))
      toast.error(weekdayValidation.message ?? 'Nieprawidlowe przedzialy dla dni powszednich.')
      return false
    }
    setTierErrors((prev) => ({ ...prev, weekday: [] }))

    const weekendValidation = normalizeAndValidateTiers(weekendTiersToSave, 'weekend')
    if (!weekendValidation.isValid) {
      setWeekendTiers(weekendValidation.sorted)
      setTierErrors((prev) => ({
        ...prev,
        weekend: weekendValidation.errors ?? [],
      }))
      toast.error(weekendValidation.message ?? 'Nieprawidlowe przedzialy dla weekendu.')
      return false
    }
    setTierErrors((prev) => ({ ...prev, weekend: [] }))

    // Keep UI consistent with what is persisted.
    setWeekdayTiers(weekdayValidation.sorted)
    setWeekendTiers(weekendValidation.sorted)

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('propertyId', selectedPropertyId)
      formData.append('weekdayTiers', JSON.stringify(weekdayValidation.sorted))
      formData.append('weekendTiers', JSON.stringify(weekendValidation.sorted))
      formData.append('weekdayExtraBedPrice', weekdayExtraBedPrice.toString())
      formData.append('weekendExtraBedPrice', weekendExtraBedPrice.toString())

      if (selectedSeasonId === OFF_SEASON_ID) {
        formData.append('mode', 'basic')
        const result = await updateBasicPrices(null, formData)
        if (result.success) {
          toast.success('Zapisano ceny podstawowe')
          setIsSeasonDirty(false)
        } else {
          toast.error(result.message)
          return false
        }
      } else {
        formData.append('mode', 'season')
        formData.append('seasonId', selectedSeasonId)
        const result = await updateSeasonPricesForProperty(null, formData)
        if (result.success) {
          const season = seasons.find((s) => s._id === selectedSeasonId)
          toast.success(`Zapisano ceny dla: ${season?.name ?? 'sezonu'}`)
          setIsSeasonDirty(false)
        } else {
          toast.error(result.message)
          return false
        }
      }
      return true
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd podczas zapisu')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // ── Ceny indywidualne (per data) ─────────────────────────────────────────────

  const handleDateSelect = useCallback(
    (dates: BookingDates) => {
      setBookingDates((prev) => {
        if (prev.start === dates.start && prev.end === dates.end) return prev
        return dates
      })
      setIsCustomDirty(false)

      if (dates.start && !dates.end) {
        const priceEntry = customPrices.find((p) => p.date === dates.start)
        if (priceEntry) {
          setCustomTiers(
            priceEntry.prices?.length
              ? priceEntry.prices
              : [{ minGuests: 1, maxGuests: 2, price: priceEntry.previewPrice || 350 }]
          )
          setCustomExtraBedPrice(priceEntry.extraBedPrice ?? DEFAULT_CUSTOM_EXTRA_BED_PRICE)
          setCustomTierErrors([])
        } else {
          setCustomTiers([...DEFAULT_CUSTOM_TIERS])
          setCustomExtraBedPrice(DEFAULT_CUSTOM_EXTRA_BED_PRICE)
          setCustomTierErrors([])
        }
      } else {
      }
    },
    [customPrices]
  )

  useEffect(() => {
    if (!isCustomRangeMode && bookingDates.start && bookingDates.end) {
      handleDateSelect({ start: bookingDates.start, end: null, count: 0 })
    }
  }, [isCustomRangeMode, bookingDates.start, bookingDates.end, handleDateSelect])

  const refreshCustomPrices = async () => {
    const prices = await getCustomPrices(selectedPropertyId)
    setCustomPrices(prices)
    const priceMap: Record<string, number> = {}
    prices.forEach((p) => {
      priceMap[p.date] = p.previewPrice
    })
    setCalendarPrices(priceMap)
  }

  const handleCustomTierChange = (
    index: number,
    field: keyof PriceTier,
    value: number
  ) => {
    setIsCustomDirty(true)
    setCustomTierErrors([])
    setCustomTiers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addCustomTier = () => {
    const tiers = customTiers
    const fallbackPrice = 350

    setIsCustomDirty(true)
    setCustomTierErrors([])

    if (tiers.length === 0) {
      setCustomTiers([{ minGuests: 1, maxGuests: 2, price: fallbackPrice }])
      return
    }

    const last = tiers[tiers.length - 1]
    setCustomTiers((prev) => [
      ...prev,
      { minGuests: last.maxGuests + 1, maxGuests: last.maxGuests + 2, price: last.price },
    ])
  }

  const removeCustomTier = (index: number) => {
    setIsCustomDirty(true)
    setCustomTierErrors([])
    setCustomTiers((prev) => prev.filter((_, i) => i !== index))
  }

  const getCustomTierError = (index: number) =>
    customTierErrors.find((error) => error.index === index)

  const buildDateRange = (): string[] => {
    if (!bookingDates.start) return []
    const dates: string[] = []
    const start = dayjs(bookingDates.start)
    if (bookingDates.end) {
      const end = dayjs(bookingDates.end)
      let current = start
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        dates.push(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }
    } else {
      dates.push(start.format('YYYY-MM-DD'))
    }
    return dates
  }

  const handleSaveCustomPrice = async (): Promise<boolean> => {
    if (!selectedPropertyId || !bookingDates.start) return false

    const customValidation = normalizeAndValidateTiers(customTiers, 'custom')
    if (!customValidation.isValid) {
      setCustomTiers(customValidation.sorted)
      setCustomTierErrors(customValidation.errors ?? [])
      toast.error(customValidation.message ?? 'Nieprawidlowe przedzialy custom dla wybranych dni.')
      return false
    }

    setCustomTierErrors([])
    setCustomTiers(customValidation.sorted)

    setIsSaving(true)
    try {
      const result = await updateCustompriceForDate({
        propertyId: selectedPropertyId,
        dates: buildDateRange(),
        prices: customValidation.sorted,
        extraBedPrice: customExtraBedPrice,
      })

      if (result?.success) {
        toast.success(result.message)
        await refreshCustomPrices()
        setBookingDates({ start: null, end: null, count: 0 })
        setIsCustomDirty(false)
        return true
      } else {
        toast.error(result?.message ?? 'Błąd zapisu')
        return false
      }
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const resetCustomEditorToCurrentSelection = () => {
    if (!bookingDates.start) {
      setCustomTiers([...DEFAULT_CUSTOM_TIERS])
      setCustomExtraBedPrice(DEFAULT_CUSTOM_EXTRA_BED_PRICE)
      setCustomTierErrors([])
      return
    }

    const priceEntry = customPrices.find((p) => p.date === bookingDates.start)
    if (priceEntry) {
      setCustomTiers(priceEntry.prices?.length ? priceEntry.prices : [...DEFAULT_CUSTOM_TIERS])
      setCustomExtraBedPrice(priceEntry.extraBedPrice ?? DEFAULT_CUSTOM_EXTRA_BED_PRICE)
    } else {
      setCustomTiers([...DEFAULT_CUSTOM_TIERS])
      setCustomExtraBedPrice(DEFAULT_CUSTOM_EXTRA_BED_PRICE)
    }
    setCustomTierErrors([])
  }

  const handleSaveAll = async () => {
    if (isSaving || isLoadingPrices || isDeletingCustom || isDiscarding) return

    let seasonSaved = true
    let customSaved = true

    if (isSeasonDirty) {
      seasonSaved = await handleSavePrices()
    }
    if (seasonSaved && isCustomDirty) {
      customSaved = await handleSaveCustomPrice()
    }

    if (seasonSaved && customSaved) {
      setIsSeasonDirty(false)
      setIsCustomDirty(false)
    }
  }

  const handleDiscardAll = async () => {
    if (isSaving || isLoadingPrices || isDeletingCustom || isDiscarding) return
    setIsDiscarding(true)

    try {
      if (isSeasonDirty) {
        await loadSeasonPrices()
      }
      if (isCustomDirty) {
        resetCustomEditorToCurrentSelection()
      }
      setIsSeasonDirty(false)
      setIsCustomDirty(false)
    } finally {
      setIsDiscarding(false)
    }
  }

  const handleRemoveCustomPrice = async () => {
    if (!selectedPropertyId || !bookingDates.start) return

    setIsDeletingCustom(true)
    try {
      const result = await deleteCustomPricesForDate({
        propertyId: selectedPropertyId,
        dates: buildDateRange(),
      })

      if (result?.success) {
        toast.success(result.message)
        await refreshCustomPrices()
        setBookingDates({ start: null, end: null, count: 0 })
        setIsCustomDirty(false)
      } else {
        toast.error(result?.message ?? 'Błąd usuwania')
      }
    } catch (error) {
      console.error(error)
      toast.error('Wystąpił błąd')
    } finally {
      setIsDeletingCustom(false)
    }
  }

  const handleDeleteCustomPriceForDate = async () => {
    if (!selectedProperty?._id || !deleteCustomModal.date) return
    setIsDeletingCustomSingle(true)
    try {
      const res = await deleteCustomPricesForDate({ propertyId: selectedProperty._id, dates: [deleteCustomModal.date] })
      if (res?.success) {
        toast.success(res.message)
        await refreshCustomPrices()
      } else {
        toast.error(res?.message ?? 'Błąd podczas usuwania ceny indywidualnej.')
      }
    } catch (e) {
      toast.error('Błąd podczas usuwania ceny indywidualnej.')
    } finally {
      setIsDeletingCustomSingle(false)
      setDeleteCustomModal({ isOpen: false, date: null })
    }
  }

  const handleCopyPrices = async () => {
    if (!selectedPropertyId) return
    setIsCopying(true)
    try {
      const result = await copyPricesToAllProperties(selectedPropertyId)
      if (result.success) {
        toast.success(result.message)
        setCopyConfirmOpen(false)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Wystąpił błąd podczas kopiowania cen')
    } finally {
      setIsCopying(false)
    }
  }

  const getDayType = (dateStr: string) => {
    const day = dayjs(dateStr).day()
    return day === 0 || day === 6 ? 'weekend' : 'weekday'
  }

  const selectedProperty = properties.find((p) => p._id === selectedPropertyId)
  const selectedSeason = seasons.find((s) => s._id === selectedSeasonId)
  const isAnyDirty = isSeasonDirty || isCustomDirty
  const isPropertyDataLoading =
    !!selectedPropertyId && (isLoadingPrices || isLoadingCustomPrices)

  return (
    <>
      {/* ── Potwierdzenie kopiowania cen ──────────────────────────────────── */}
      <Modal
        isOpen={copyConfirmOpen}
        onClose={() => setCopyConfirmOpen(false)}
        onConfirm={handleCopyPrices}
        confirmText="Tak, kopiuj"
        confirmVariant="danger"
        isLoading={isCopying}
        loadingText="Kopiowanie..."
        title="Potwierdź kopiowanie cen"
      >
        <p style={{ marginBottom: '16px' }}>
          Czy na pewno chcesz skopiować wszystkie ceny z obiektu <strong>{selectedProperty?.name}</strong> do wszystkich pozostałych obiektów?
        </p>
        <p style={{ color: '#c0392b', fontSize: '0.9rem' }}>
          Uwaga: istniejące ceny w pozostałych obiektach zostaną nadpisane. Dotyczy to cen:
          <br />
          - bazowych,
          <br />
          - sezonowych,
          <br />
          - indywidualnych,
          <br />
          - dostawek.
        </p>
      </Modal>

      {/* ── Wybór domku ──────────────────────────────────────────────────────── */}
      <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
        <div className="card-header">
          <h2 className="card-title">Wybierz domek</h2>
        </div>
        <div className="setting-row">
          <div className="setting-content">
            <label className="setting-label">Obiekt</label>
            <p className="setting-description">
              Wybierz domek, dla którego chcesz skonfigurować ceny.
            </p>
            {selectedPropertyId && (
              <button
                type="button"
                onClick={() => setCopyConfirmOpen(true)}
                className={styles['price-settings__copy-link']}
                disabled={isCopying}
              >
                Skopiuj ceny z tego domku do pozostałych domków
              </button>
            )}
          </div>
          <div className="setting-control">
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setIsLoadingPrices(true)
                setIsLoadingCustomPrices(true)
                setSelectedPropertyId(e.target.value)
                setSelectedSeasonId(OFF_SEASON_ID)
                setIsSeasonDirty(false)
                setIsCustomDirty(false)
              }}
              className={styles['price-settings__date-input-select--wide']}
            >
              <option value="">-- Wybierz domek --</option>
              {properties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {isPropertyDataLoading && (
        <div className="settings-card">
          <div className={styles['price-settings__property-loading-state']}>
            <span className={styles['price-settings__property-loading-spinner']} aria-hidden="true"></span>
            <span>Wczytywanie...</span>
          </div>
        </div>
      )}

      {/* ── Konfiguracja cen (tylko gdy wybrany domek) ───────────────────────── */}
      {selectedPropertyId && !isPropertyDataLoading && (
        <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
          <div className="card-header">
            <h2 className="card-title">Konfiguracja cen sezonów</h2>
            <div className={`setting-control ${styles['price-settings__header-select-control']}`}>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className={styles['price-settings__date-input-select']}
                disabled={isLoadingPrices}
              >
                <option value={OFF_SEASON_ID}>🌿 Poza sezonem (ceny bazowe)</option>
                {seasons.map((season) => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))}
              </select>
              <Link href="/admin/settings/booking" className={styles['price-settings__copy-link']}>
                Przejdź do ustawień nazw i dat sezonów
              </Link>
            </div>
          </div>

          {/* Nagłówek kontekstu */}
          <div
            className={`setting-row ${styles['price-settings__context-row']}`}
          >
            <div className="setting-content">
              <strong>
                {isLoadingPrices
                  ? 'Ładowanie cen...'
                  : selectedSeasonId === OFF_SEASON_ID
                    ? `Ceny podstawowe dla: ${selectedProperty?.name}`
                    : `Ceny w sezonie "${selectedSeason?.name}" dla: ${selectedProperty?.name}`}
              </strong>
            </div>
          </div>

          {/* Cena weekday */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">
                Cena za dobę – Dzień powszedni (nd–czw)
              </label>
              <p className="setting-description">
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles['price-settings__tiers-container']}>
                {weekdayTiers.map((tier, index) => {
                  const tierError = getTierError('weekday', index)
                  return (
                    <div key={index} className={styles['price-settings__tier-row-wrapper']}>
                      <div className={`${styles['price-settings__tier-row']} ${tierError ? styles['price-settings__tier-row--error'] : ''}`}>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Osób od</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.minGuests}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekday',
                                index,
                                'minGuests',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('minGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Osób do</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.maxGuests}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekday',
                                index,
                                'maxGuests',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('maxGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Cena</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={tier.price}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekday',
                                index,
                                'price',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`${styles['price-settings__price-input']} ${tierError?.fields.includes('price') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <span className={styles['price-settings__currency']}>zł</span>
                        {weekdayTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestRemoveTier('weekday', index)}
                            className={styles['price-settings__remove-tier-btn']}
                            disabled={isLoadingPrices}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {tierError && <p className={styles['price-settings__tier-error-text']}>{tierError.message}</p>}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addTier('weekday')}
                  className={styles['price-settings__add-tier-btn']}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* Cena weekend */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">
                Cena za dobę – Weekend (pt–sob)
              </label>
              <p className="setting-description">
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className="setting-control">
              <div className={styles['price-settings__tiers-container']}>
                {weekendTiers.map((tier, index) => {
                  const tierError = getTierError('weekend', index)
                  return (
                    <div key={index} className={styles['price-settings__tier-row-wrapper']}>
                      <div className={`${styles['price-settings__tier-row']} ${tierError ? styles['price-settings__tier-row--error'] : ''}`}>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Osób od</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.minGuests}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekend',
                                index,
                                'minGuests',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('minGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Osób do</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.maxGuests}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekend',
                                index,
                                'maxGuests',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('maxGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles['price-settings__tier-field']}>
                          <span className={styles['price-settings__tier-field-label']}>Cena</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={tier.price}
                            onChange={(e) =>
                              handleBaseRateChange(
                                'weekend',
                                index,
                                'price',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`${styles['price-settings__price-input']} ${tierError?.fields.includes('price') ? styles['price-settings__tier-input--error'] : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <span className={styles['price-settings__currency']}>zł</span>
                        {weekendTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestRemoveTier('weekend', index)}
                            className={styles['price-settings__remove-tier-btn']}
                            disabled={isLoadingPrices}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {tierError && <p className={styles['price-settings__tier-error-text']}>{tierError.message}</p>}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addTier('weekend')}
                  className={styles['price-settings__add-tier-btn']}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          {/* Dostawka weekday */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (dzień powszedni)</label>
            </div>
            <div className="setting-control">
              <div className={styles['price-settings__price-control']}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekdayExtraBedPrice}
                  onChange={(e) => {
                    setWeekdayExtraBedPrice(parseInt(e.target.value) || 0)
                    setIsSeasonDirty(true)
                  }
                  }
                  className={styles['price-settings__price-input--large']}
                  disabled={isLoadingPrices}
                />
                <span className={styles['price-settings__currency']}>zł / noc</span>
              </div>
            </div>
          </div>

          {/* Dostawka weekend */}
          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Cena za dostawkę (weekend)</label>
            </div>
            <div className="setting-control">
              <div className={styles['price-settings__price-control']}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekendExtraBedPrice}
                  onChange={(e) => {
                    setWeekendExtraBedPrice(parseInt(e.target.value) || 0)
                    setIsSeasonDirty(true)
                  }
                  }
                  className={styles['price-settings__price-input--large']}
                  disabled={isLoadingPrices}
                />
                <span className={styles['price-settings__currency']}>zł / noc</span>
              </div>
            </div>
          </div>

        </form>
      )}

      {/* ── Ceny indywidualne (per data) ─────────────────────────────────────── */}
      {selectedPropertyId && !isPropertyDataLoading && (
        <form className="settings-card" onSubmit={(e) => e.preventDefault()}>
          <div className="card-header">
            <h2 className="card-title">Ceny indywidualne</h2>
            <span className="card-badge">Per domek / data</span>
          </div>

          <div className="setting-row">
            <div className="setting-content">
              <label className="setting-label">Wybierz datę lub zakres dat</label>
              <p className="setting-description">
                Kliknij na dzień w kalendarzu, aby ustawić cenę. Możesz wybrać
                pojedynczy dzień lub zakres dat.
              </p>
              <label className={styles['price-settings__selection-mode-toggle']}>
                <input
                  type="checkbox"
                  checked={!isCustomRangeMode}
                  onChange={(e) => setIsCustomRangeMode(!e.target.checked)}
                />
                Zaznaczaj jeden dzień
              </label>
            </div>
            <div className="setting-control">
              <div className={styles['price-settings__calendar-wrapper']}>
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={handleDateSelect}
                  minBookingDays={0}
                  maxBookingDays={365}
                  isRange={isCustomRangeMode}
                />
              </div>
              {bookingDates.start && (
                <div className={styles['price-settings__selected-date-info']}>
                  <span>
                    Wybrano: {formatDisplayDate(bookingDates.start)}
                    {bookingDates.end && ` — ${formatDisplayDate(bookingDates.end)}`}
                  </span>
                  {!bookingDates.end && (
                    <span className={styles['price-settings__day-type']}>
                      (
                      {getDayType(bookingDates.start) === 'weekend'
                        ? 'Weekend'
                        : 'Dzień powszedni'}
                      )
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {bookingDates.start && (
            <>
              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label">
                    Cena za dobę (dla wybranego dnia / zakresu)
                  </label>
                  <p className="setting-description">
                    Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
                  </p>
                </div>
                <div className="setting-control">
                  <div className={styles['price-settings__tiers-container']}>
                    {customTiers.map((tier, index) => {
                      const tierError = getCustomTierError(index)
                      return (
                        <div key={index} className={styles['price-settings__tier-row-wrapper']}>
                          <div className={`${styles['price-settings__tier-row']} ${tierError ? styles['price-settings__tier-row--error'] : ''}`}>
                            <label className={styles['price-settings__tier-field']}>
                              <span className={styles['price-settings__tier-field-label']}>Osób od</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={tier.minGuests}
                                onChange={(e) =>
                                  handleCustomTierChange(
                                    index,
                                    'minGuests',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('minGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                              />
                            </label>
                            <label className={styles['price-settings__tier-field']}>
                              <span className={styles['price-settings__tier-field-label']}>Osób do</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={tier.maxGuests}
                                onChange={(e) =>
                                  handleCustomTierChange(
                                    index,
                                    'maxGuests',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className={`${styles['price-settings__tier-input']} ${tierError?.fields.includes('maxGuests') ? styles['price-settings__tier-input--error'] : ''}`}
                              />
                            </label>
                            <label className={styles['price-settings__tier-field']}>
                              <span className={styles['price-settings__tier-field-label']}>Cena</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={tier.price}
                                onChange={(e) =>
                                  handleCustomTierChange(
                                    index,
                                    'price',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={`${styles['price-settings__price-input']} ${tierError?.fields.includes('price') ? styles['price-settings__tier-input--error'] : ''}`}
                              />
                            </label>
                            <span className={styles['price-settings__currency']}>zł</span>
                            {customTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCustomTier(index)}
                                className={styles['price-settings__remove-tier-btn']}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {tierError && <p className={styles['price-settings__tier-error-text']}>{tierError.message}</p>}
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={addCustomTier}
                      className={styles['price-settings__add-tier-btn']}
                    >
                      + Dodaj przedział
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-content">
                  <label className="setting-label">Cena za dostawkę</label>
                </div>
                <div className="setting-control">
                  <div className={styles['price-settings__price-control']}>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={customExtraBedPrice}
                      onChange={(e) => {
                        setCustomExtraBedPrice(parseInt(e.target.value, 10) || 0)
                        setIsCustomDirty(true)
                      }
                      }
                      className={styles['price-settings__price-input--large']}
                    />
                    <span className={styles['price-settings__currency']}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className={`form-actions ${styles['price-settings__form-actions-row']}`}>
                <button
                  type="button"
                  className={`btn-primary ${styles['price-settings__danger-button']}`}
                  onClick={handleRemoveCustomPrice}
                  disabled={isSaving || isDeletingCustom}
                >
                  {isDeletingCustom ? 'Przywracanie...' : '🗑️ Przywróć cenę sezonową dla zaznaczonego dnia'}
                </button>
              </div>
            </>
          )}

          {/* Lista ustawionych cen indywidualnych */}
          {customPrices.length > 0 && (
            <div className="setting-row">
              <div className={`setting-content ${styles['price-settings__full-width']}`}>
                <label className="setting-label">
                  Ustawione ceny indywidualne dla: {selectedProperty?.name}
                </label>
                <div className={styles['price-settings__custom-prices-list']}>
                  {(isCustomPricesExpanded
                    ? customPrices
                    : customPrices.slice(0, 10)
                  ).map((entry, idx) => (
                    <div key={idx} className={styles['price-settings__custom-price-item']}>
                      <span className={styles['price-settings__custom-price-date']}>{entry.date}</span>
                      <span className={styles['price-settings__custom-price-value']}>od {entry.previewPrice} zł</span>
                      <button
                        type="button"
                        className={styles['price-settings__remove-tier-btn']}
                        aria-label="Usuń cenę indywidualną"
                        onClick={() => {
                          setDeleteCustomModal({ isOpen: true, date: entry.date })
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {customPrices.length > 10 && (
                    <button
                      type="button"
                      className={`${styles['price-settings__more-items']} ${styles['price-settings__more-items--button']}`}
                      onClick={() => setIsCustomPricesExpanded(!isCustomPricesExpanded)}
                    >
                      {isCustomPricesExpanded
                        ? 'Zwiń'
                        : `+ ${customPrices.length - 10} więcej...`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      <div className={`floating-save-bar ${isAnyDirty ? 'visible' : ''}`}>
        <div className="floating-save-content">
          <p className="floating-save-text">
            {isSeasonDirty && isCustomDirty
              ? 'Masz niezapisane zmiany w cenach sezonowych i indywidualnych.'
              : isSeasonDirty
                ? `Masz niezapisane zmiany w cenach dla ${selectedProperty?.name ?? 'wybranego domku'}.`
                : 'Masz niezapisane zmiany w cenach indywidualnych.'}
          </p>
          <div className="floating-save-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDiscardAll}
              disabled={isSaving || isLoadingPrices || isDeletingCustom || isDiscarding}
            >
              {isDiscarding ? 'Przywracanie...' : 'Odrzuć'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveAll}
              disabled={isSaving || isLoadingPrices || isDeletingCustom || isDiscarding}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz wszystko'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal potwierdzenia usunięcia przedziału */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, index: null })}
        onConfirm={confirmRemoveTier}
        title="Usuń przedział cenowy"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
        isLoading={isRemovingTier}
        loadingText="Usuwanie..."
      >
        <p>Czy na pewno chcesz usunąć ten przedział cenowy?</p>
      </Modal>

      <Modal
        isOpen={deleteCustomModal.isOpen}
        onClose={() => setDeleteCustomModal({ isOpen: false, date: null })}
        onConfirm={handleDeleteCustomPriceForDate}
        title="Usuń cenę indywidualną"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
        isLoading={isDeletingCustomSingle}
      >
        <p>Czy na pewno chcesz usunąć cenę indywidualną dla tej daty?</p>
      </Modal>
    </>
  )
}
