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
import styles from './PriceSettingsForm.module.css'

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
const DEFAULT_CUSTOM_TIERS: InputPriceTier[] = [{ minGuests: 1, maxGuests: 2, price: 350 }]
const DEFAULT_CUSTOM_EXTRA_BED_PRICE = 100

type InputPriceTier = {
  minGuests: number | ""
  maxGuests: number | ""
  price: number | ""
}

function hasEmptyTierFields(tiers: InputPriceTier[]): boolean {
  return tiers.some((t) => t.minGuests === "" || t.maxGuests === "" || t.price === "")
}

function toNumberTiers(tiers: InputPriceTier[]): PriceTier[] {
  return tiers.map((t) => ({
    minGuests: t.minGuests as number,
    maxGuests: t.maxGuests as number,
    price: t.price as number,
  }))
}

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
  const [weekdayTiers, setWeekdayTiers] = useState<InputPriceTier[]>([])
  const [weekendTiers, setWeekendTiers] = useState<InputPriceTier[]>([])
  const [weekdayExtraBedPrice, setWeekdayExtraBedPrice] = useState<number | "">(50)
  const [weekendExtraBedPrice, setWeekendExtraBedPrice] = useState<number | "">(70)

  // ── Ceny indywidualne (per data) ────────────────────────────────────────────
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  })
  const [customTiers, setCustomTiers] = useState<InputPriceTier[]>([...DEFAULT_CUSTOM_TIERS])
  const [customPrices, setCustomPrices] = useState<CustomPriceEntry[]>([])
  const [customExtraBedPrice, setCustomExtraBedPrice] = useState<number | "">(DEFAULT_CUSTOM_EXTRA_BED_PRICE)
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
      const allPrices = await getPricesForProperty(selectedPropertyId)

      const basicPrices = allPrices.find(
        (p: any) => p.seasonId === null || p.seasonId === undefined
      )

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

  useEffect(() => {
    loadSeasonPrices()
  }, [loadSeasonPrices])

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

  const handleBaseRateChange = (
    type: 'weekday' | 'weekend',
    index: number,
    field: keyof PriceTier,
    value: number | ""
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
    if (last.maxGuests === "" || last.price === "") return
    setTierErrors((prev) => ({ ...prev, [type]: [] }))
    setter((prev) => [
      ...prev,
      { minGuests: (last.maxGuests as number) + 1, maxGuests: (last.maxGuests as number) + 2, price: (last.price as number) + 100 },
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

  const handleSavePrices = async (overrides?: {
    weekdayTiersOverride?: InputPriceTier[]
    weekendTiersOverride?: InputPriceTier[]
  }): Promise<boolean> => {
    if (!selectedPropertyId) {
      toast.error('Wybierz obiekt')
      return false
    }

    const weekdayInputTiers =
      overrides && overrides.weekdayTiersOverride
        ? overrides.weekdayTiersOverride
        : weekdayTiers
    const weekendInputTiers =
      overrides && overrides.weekendTiersOverride
        ? overrides.weekendTiersOverride
        : weekendTiers

    if (hasEmptyTierFields(weekdayInputTiers)) {
      toast.error('Uzupełnij wszystkie pola w przedziale cenowym (dzień powszedni).')
      return false
    }
    if (hasEmptyTierFields(weekendInputTiers)) {
      toast.error('Uzupełnij wszystkie pola w przedziale cenowym (weekend).')
      return false
    }
    if (weekdayExtraBedPrice === "") {
      toast.error('Cena za dostawkę (dzień powszedni) nie może być pusta.')
      return false
    }
    if (weekendExtraBedPrice === "") {
      toast.error('Cena za dostawkę (weekend) nie może być pusta.')
      return false
    }

    const weekdayTiersToSave = toNumberTiers(weekdayInputTiers)
    const weekendTiersToSave = toNumberTiers(weekendInputTiers)

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

    setWeekdayTiers(weekdayValidation.sorted)
    setWeekendTiers(weekendValidation.sorted)

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('propertyId', selectedPropertyId)
      formData.append('weekdayTiers', JSON.stringify(weekdayValidation.sorted))
      formData.append('weekendTiers', JSON.stringify(weekendValidation.sorted))
      formData.append('weekdayExtraBedPrice', (weekdayExtraBedPrice as number).toString())
      formData.append('weekendExtraBedPrice', (weekendExtraBedPrice as number).toString())

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
    value: number | ""
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
    if (last.maxGuests === "" || last.price === "") return
    setCustomTiers((prev) => [
      ...prev,
      { minGuests: (last.maxGuests as number) + 1, maxGuests: (last.maxGuests as number) + 2, price: last.price },
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

    if (hasEmptyTierFields(customTiers)) {
      toast.error('Uzupełnij wszystkie pola w przedziale cenowym.')
      return false
    }
    if (customExtraBedPrice === "") {
      toast.error('Cena za dostawkę nie może być pusta.')
      return false
    }

    const customValidation = normalizeAndValidateTiers(toNumberTiers(customTiers), 'custom')
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
        extraBedPrice: customExtraBedPrice as number,
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

      <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Wybierz obiekt</h2>
        </div>
        <div className={styles.row}>
          <div className={styles.content}>
            <label className={styles.label}>Obiekt</label>
            <p className={styles.description}>
              Wybierz obiekt, dla którego chcesz skonfigurować ceny.
            </p>
          </div>
          <div className={styles.control}>
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
              className={styles.select}
            >
              <option value="">-- Wybierz obiekt --</option>
              {properties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.name}
                </option>
              ))}
            </select>
            {selectedPropertyId && (
              <button
                type="button"
                onClick={() => setCopyConfirmOpen(true)}
                className={styles.copyLink}
                disabled={isCopying}
              >
                Skopiuj ceny z tego domku do pozostałych domków
              </button>
            )}
          </div>
        </div>
      </form>

      {isPropertyDataLoading && (
        <div className={styles.card}>
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden="true"></span>
            <span>Wczytywanie...</span>
          </div>
        </div>
      )}

      {selectedPropertyId && !isPropertyDataLoading && (
        <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Konfiguracja cen sezonów</h2>
            <div className={styles.control}>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className={styles.select}
                disabled={isLoadingPrices}
              >
                <option value={OFF_SEASON_ID}>🌿 Poza sezonem (ceny bazowe)</option>
                {seasons.map((season) => (
                  <option key={season._id} value={season._id}>
                    {season.name} {!season.isActive && '(nieaktywny)'}
                  </option>
                ))}
              </select>
              <Link href="/admin/settings/booking" className={styles.copyLink}>
                Przejdź do ustawień nazw i dat sezonów
              </Link>
            </div>
          </div>

          <div className={`${styles.row} ${styles.rowContext}`}>
            <div className={styles.content}>
              <strong>
                {isLoadingPrices
                  ? 'Ładowanie cen...'
                  : selectedSeasonId === OFF_SEASON_ID
                    ? `Ceny podstawowe dla: ${selectedProperty?.name}`
                    : `Ceny w sezonie "${selectedSeason?.name}" dla: ${selectedProperty?.name}`}
              </strong>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.content}>
              <label className={styles.label}>
                Cena za dobę – Dzień powszedni (nd–czw)
              </label>
              <p className={styles.description}>
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className={styles.control}>
              <div className={styles.tiersContainer}>
                {weekdayTiers.map((tier, index) => {
                  const tierError = getTierError('weekday', index)
                  return (
                    <div key={index} className={styles.tierRowWrapper}>
                      <div className={`${styles.tierRow} ${tierError ? styles.tierRowError : ''}`}>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Osób od</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={tier.minGuests}
                              onChange={e => handleBaseRateChange('weekday', index, 'minGuests', e.target.value === '' ? '' : Number(e.target.value))}
                              className={`${styles.input} ${tierError?.fields.includes('minGuests') ? styles.inputError : ''}`}
                              disabled={isLoadingPrices}
                            />
                        </label>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Osób do</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={tier.maxGuests}
                              onChange={e => handleBaseRateChange('weekday', index, 'maxGuests', e.target.value === '' ? '' : Number(e.target.value))}
                              className={`${styles.input} ${tierError?.fields.includes('maxGuests') ? styles.inputError : ''}`}
                              disabled={isLoadingPrices}
                            />
                        </label>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Cena</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={tier.price}
                              onChange={e => handleBaseRateChange('weekday', index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                              className={`${styles.input} ${tierError?.fields.includes('price') ? styles.inputError : ''}`}
                              disabled={isLoadingPrices}
                            />
                        </label>
                        <span className={styles.currency}>zł</span>
                        {weekdayTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestRemoveTier('weekday', index)}
                            className={styles.removeBtn}
                            disabled={isLoadingPrices}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {tierError && <p className={styles.tierErrorText}>{tierError.message}</p>}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addTier('weekday')}
                  className={styles.addBtn}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.content}>
              <label className={styles.label}>
                Cena za dobę – Weekend (pt–sob)
              </label>
              <p className={styles.description}>
                Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
              </p>
            </div>
            <div className={styles.control}>
              <div className={styles.tiersContainer}>
                {weekendTiers.map((tier, index) => {
                  const tierError = getTierError('weekend', index)
                  return (
                    <div key={index} className={styles.tierRowWrapper}>
                      <div className={`${styles.tierRow} ${tierError ? styles.tierRowError : ''}`}>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Osób od</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.minGuests}
                            onChange={e => handleBaseRateChange('weekend', index, 'minGuests', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`${styles.input} ${tierError?.fields.includes('minGuests') ? styles.inputError : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Osób do</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.maxGuests}
                            onChange={e => handleBaseRateChange('weekend', index, 'maxGuests', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`${styles.input} ${tierError?.fields.includes('maxGuests') ? styles.inputError : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <label className={styles.tierField}>
                          <span className={styles.tierFieldLabel}>Cena</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={tier.price}
                            onChange={e => handleBaseRateChange('weekend', index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`${styles.input} ${tierError?.fields.includes('price') ? styles.inputError : ''}`}
                            disabled={isLoadingPrices}
                          />
                        </label>
                        <span className={styles.currency}>zł</span>
                        {weekendTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestRemoveTier('weekend', index)}
                            className={styles.removeBtn}
                            disabled={isLoadingPrices}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {tierError && <p className={styles.tierErrorText}>{tierError.message}</p>}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addTier('weekend')}
                  className={styles.addBtn}
                  disabled={isLoadingPrices}
                >
                  + Dodaj przedział
                </button>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.content}>
              <label className={styles.label}>Cena za dostawkę (dzień powszedni)</label>
            </div>
            <div className={styles.control}>
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekdayExtraBedPrice}
                  onChange={e => {
                    setWeekdayExtraBedPrice(e.target.value === '' ? '' : Number(e.target.value))
                    setIsSeasonDirty(true)
                  }}
                  className={`${styles.input} ${styles.inputLarge}`}
                  disabled={isLoadingPrices}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.content}>
              <label className={styles.label}>Cena za dostawkę (weekend)</label>
            </div>
            <div className={styles.control}>
              <div className={styles.priceControl}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weekendExtraBedPrice}
                  onChange={e => {
                    setWeekendExtraBedPrice(e.target.value === '' ? '' : Number(e.target.value))
                    setIsSeasonDirty(true)
                  }}
                  className={`${styles.input} ${styles.inputLarge}`}
                  disabled={isLoadingPrices}
                />
                <span className={styles.currency}>zł / noc</span>
              </div>
            </div>
          </div>

        </form>
      )}

      {selectedPropertyId && !isPropertyDataLoading && (
        <form className={styles.card} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Ceny indywidualne</h2>
            <span className={styles.cardBadge}>Per obiekt / data</span>
          </div>

          <div className={styles.row}>
            <div className={styles.content}>
              <label className={styles.label}>Wybierz datę lub zakres dat</label>
              <p className={styles.description}>
                Kliknij na dzień w kalendarzu, aby ustawić cenę. Możesz wybrać
                pojedynczy dzień lub zakres dat.
              </p>
              <label className={styles.selectionMode}>
                <input
                  type="checkbox"
                  checked={!isCustomRangeMode}
                  onChange={(e) => setIsCustomRangeMode(!e.target.checked)}
                />
                Zaznaczaj jeden dzień
              </label>
            </div>
            <div className={styles.control}>
              <div className={styles.calendarWrapper}>
                <CalendarPicker
                  dates={calendarDates}
                  onDateChange={handleDateSelect}
                  minBookingDays={0}
                  maxBookingDays={365}
                  isRange={isCustomRangeMode}
                />
              </div>
              {bookingDates.start && (
                <div className={styles.selectedInfo}>
                  <span>
                    Wybrano: {formatDisplayDate(bookingDates.start)}
                    {bookingDates.end && ` — ${formatDisplayDate(bookingDates.end)}`}
                  </span>
                  {!bookingDates.end && (
                    <span className={styles.dayBadge}>
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
              <div className={styles.row}>
                <div className={styles.content}>
                  <label className={styles.label}>
                    Cena za dobę (dla wybranego dnia / zakresu)
                  </label>
                  <p className={styles.description}>
                    Ustaw przedziały: od ilu osób do ilu osób i za jaką cenę.
                  </p>
                </div>
                <div className={styles.control}>
                  <div className={styles.tiersContainer}>
                    {customTiers.map((tier, index) => {
                      const tierError = getCustomTierError(index)
                      return (
                        <div key={index} className={styles.tierRowWrapper}>
                          <div className={`${styles.tierRow} ${tierError ? styles.tierRowError : ''}`}>
                            <label className={styles.tierField}>
                              <span className={styles.tierFieldLabel}>Osób od</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={tier.minGuests}
                                onChange={e => handleCustomTierChange(index, 'minGuests', e.target.value === '' ? '' : Number(e.target.value))}
                                className={`${styles.input} ${tierError?.fields.includes('minGuests') ? styles.inputError : ''}`}
                              />
                            </label>
                            <label className={styles.tierField}>
                              <span className={styles.tierFieldLabel}>Osób do</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={tier.maxGuests}
                                onChange={e => handleCustomTierChange(index, 'maxGuests', e.target.value === '' ? '' : Number(e.target.value))}
                                className={`${styles.input} ${tierError?.fields.includes('maxGuests') ? styles.inputError : ''}`}
                              />
                            </label>
                            <label className={styles.tierField}>
                              <span className={styles.tierFieldLabel}>Cena</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={tier.price}
                                onChange={e => handleCustomTierChange(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                                className={`${styles.input} ${tierError?.fields.includes('price') ? styles.inputError : ''}`}
                              />
                            </label>
                            <span className={styles.currency}>zł</span>
                            {customTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCustomTier(index)}
                                className={styles.removeBtn}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {tierError && <p className={styles.tierErrorText}>{tierError.message}</p>}
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={addCustomTier}
                      className={styles.addBtn}
                    >
                      + Dodaj przedział
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.content}>
                  <label className={styles.label}>Cena za dostawkę</label>
                </div>
                <div className={styles.control}>
                  <div className={styles.priceControl}>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={customExtraBedPrice}
                      onChange={e => {
                        setCustomExtraBedPrice(e.target.value === '' ? '' : Number(e.target.value))
                        setIsCustomDirty(true)
                      }}
                      className={`${styles.input} ${styles.inputLarge}`}
                    />
                    <span className={styles.currency}>zł / noc</span>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={handleRemoveCustomPrice}
                  disabled={isSaving || isDeletingCustom}
                >
                  {isDeletingCustom ? 'Przywracanie...' : '🗑️ Usuń cenę indywidualną'}
                </button>
              </div>
            </>
          )}

          {customPrices.length > 0 && (
            <div className={styles.row}>
              <div className={styles.content}>
                <label className={styles.label}>
                  Ustawione ceny indywidualne dla: {selectedProperty?.name}
                </label>
                <div className={styles.customList}>
                  {(isCustomPricesExpanded
                    ? customPrices
                    : customPrices.slice(0, 10)
                  ).map((entry, idx) => (
                    <div key={idx} className={styles.customItem}>
                      <span className={styles.customDate}>{entry.date}</span>
                      <span className={styles.customPrice}>od {entry.previewPrice} zł</span>
                      <button
                        type="button"
                        className={styles.removeBtn}
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
                      className={styles.copyLink}
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

      <div className={`${styles.floatingBar} ${isAnyDirty ? styles.floatingBarVisible : ''}`}>
        <div className={styles.floatingContent}>
          <p className={styles.floatingText}>
            {isSeasonDirty && isCustomDirty
              ? 'Masz niezapisane zmiany w cenach sezonowych i indywidualnych.'
              : isSeasonDirty
                ? `Masz niezapisane zmiany w cenach dla ${selectedProperty?.name ?? 'wybranego domku'}.`
                : 'Masz niezapisane zmiany w cenach indywidualnych.'}
          </p>
          <div className={styles.floatingActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleDiscardAll}
              disabled={isSaving || isLoadingPrices || isDeletingCustom || isDiscarding}
            >
              {isDiscarding ? 'Przywracanie...' : 'Odrzuć'}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOk}`}
              onClick={handleSaveAll}
              disabled={isSaving || isLoadingPrices || isDeletingCustom || isDiscarding}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz wszystko'}
            </button>
          </div>
        </div>
      </div>

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