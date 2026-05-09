'use server'
import dbConnect from '@/db/connection'
import Booking from '@/db/models/Booking'
import Property from '@/db/models/Property'
import SystemConfig from '@/db/models/SystemConfig'
import BookingConfig from '@/db/models/BookingConfig'
import { revalidatePath } from 'next/cache'
import { calculateTotalPrice } from './searchActions'
import { buildBookingOverlapFilter } from '@/utils/bookingOverlap'
import { resolveOccupiedPropertyIdsFromBookings } from '@/utils/lazyAvailabilityCleanup'
import { calculatePaymentStatus } from '@/utils/getPaymentStatus'
import { Types } from 'mongoose'
import { generateOrderId } from '@/utils/generateOrderId'

interface UnavailableDate {
  date: string | null
}

interface BlockCreateInput {
  propertyId: string
  startDate: string
  endDate: string
  adminNotes?: string
}

interface BlockedBookingListItem {
  _id: string
  propertyId: string
  propertyName: string
  startDate: string
  endDate: string
  adminNotes: string
  createdAt: string
}

const ALL_PROPERTIES_ID = 'ALL_PROPERTIES'
const ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY = true
const AVAILABILITY_STATUS_FILTER = {
  $or: [
    { status: 'blocked' },
    { status: 'confirmed' },
    { status: 'pending' },
  ],
}

async function getAllowCheckinOnDepartureDay(): Promise<boolean> {
  const bookingConfig = await BookingConfig.findById('main')
    .select('allowCheckinOnDepartureDay')
    .lean()

  if (typeof bookingConfig?.allowCheckinOnDepartureDay !== 'boolean') {
    throw new Error('Brak poprawnej konfiguracji ustawienia zameldowania w dniu wymeldowania.')
  }

  return bookingConfig.allowCheckinOnDepartureDay
}

export async function getUnavailableDatesForProperty(propertyId: string): Promise<UnavailableDate[]> {
  await dbConnect()
  const config = await SystemConfig.findById('main')
  const autoBlockOtherCabins = config?.autoBlockOtherCabins ?? true
  const allowCheckinOnDepartureDay = ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY
  const query: any = {
    ...AVAILABILITY_STATUS_FILTER,
  }

  if (!autoBlockOtherCabins) {
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookingsForCleanup = await Booking.find(query)
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup)

  const bookings = didMutateBookings
    ? await Booking.find(query)
        .select('startDate endDate')
        .lean()
    : bookingsForCleanup
  const unavailableDates = new Set<string>()
  for (const booking of bookings) {
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      unavailableDates.add(dateStr)
    }

    if (!allowCheckinOnDepartureDay) {
      unavailableDates.add(end.toISOString().split('T')[0])
    }
  }
  return Array.from(unavailableDates)
    .map(date => ({ date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

function validateBookingData(data: any) {
  const errors: string[] = []
  if (!data.propertyId) errors.push('Należy wybrać obiekt')
  if (!data.startDate) errors.push('Należy podać datę rozpoczęcia')
  if (!data.endDate) errors.push('Należy podać datę zakończenia')
  if (new Date(data.endDate) <= new Date(data.startDate)) errors.push('Data zakończenia musi być późniejsza niż data rozpoczęcia')
  const numGuests = Number(data.numGuests)
  if (isNaN(numGuests) || numGuests <= 0) errors.push('Liczba gości musi być poprawną liczbą większą od 0')
  const extraBeds = Number(data.extraBeds)
  if (isNaN(extraBeds) || extraBeds < 0) errors.push('Liczba dostawek nie może być ujemna')
  const totalPrice = Number(data.totalPrice)
  if (isNaN(totalPrice) || totalPrice < 0) errors.push('Cena całkowita nie może być ujemna')
  const paidAmount = Number(data.paidAmount)
  if (isNaN(paidAmount) || paidAmount < 0) errors.push('Wpłacona kwota nie może być ujemna')
  if (!data.guestName) errors.push('Należy podać imię i nazwisko gościa')
  if (!data.guestEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.guestEmail)) errors.push('Niepoprawny format adresu email')
  if (!data.guestPhone) errors.push('Należy podać numer telefonu gościa')
  if (data.invoice === 'true') {
    if (!data.invoiceCompany) errors.push('Nazwa firmy jest wymagana dla faktury')
    if (!data.invoiceNip) errors.push('NIP jest wymagany dla faktury')
    if (!data.invoiceStreet) errors.push('Ulica jest wymagana dla faktury')
    if (!data.invoicePostalCode) errors.push('Kod pocztowy jest wymagany dla faktury')
    if (!data.invoiceCity) errors.push('Miejscowość jest wymagana dla faktury')
  }
  return errors
}

export async function getAdminBookingsList() {
  await dbConnect()

  // Leniwe weryfikowanie "oczekujących" rezerwacji przed pobraniem całej listy
  const pendingBookingsForCleanup = await Booking.find({ status: 'pending' })
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  if (pendingBookingsForCleanup.length > 0) {
    await resolveOccupiedPropertyIdsFromBookings(pendingBookingsForCleanup)
  }

  const bookings = await Booking.find({ status: { $ne: 'blocked' } })
    .sort({ startDate: -1 })
    .populate('propertyId', 'name')
    .lean()

  const normalizedBookings = bookings.map((booking: any) => {
    const property = booking.propertyId
    const propertyId = property?._id ? String(property._id) : String(property || '')
    const paidAmount = Number(booking.paidAmount)
    const totalPrice = Number(booking.totalPrice)
    const paymentStatus = booking.paymentStatus || calculatePaymentStatus(totalPrice, paidAmount)

    return {
      ...booking,
      propertyId,
      propertyName: property?.name || 'Domek',
      paidAmount,
      paymentStatus,
    }
  })

  return JSON.parse(JSON.stringify(normalizedBookings))
}

export async function getBookingById(bookingId: string) {
  await dbConnect()
  const booking = await Booking.findById(bookingId)
    .populate('propertyId', 'name')
    .lean()

  if (!booking) {
    return null
  }

  const property = (booking as any).propertyId
  const paidAmount = Number((booking as any).paidAmount)
  const totalPrice = Number((booking as any).totalPrice)
  const paymentStatus = (booking as any).paymentStatus || calculatePaymentStatus(totalPrice, paidAmount)

  const normalizedBooking = {
    ...booking,
    propertyId: property?._id ? String(property._id) : String(property || ''),
    propertyName: property?.name || '',
    paidAmount,
    paymentStatus,
  }

  return JSON.parse(JSON.stringify(normalizedBooking))
}

export async function createBookingByAdmin(prevState: any, formData: FormData) {
  await dbConnect()
  const rawData = Object.fromEntries(formData.entries())
  const validationErrors = validateBookingData(rawData)
  if (validationErrors.length > 0) {
    return { message: validationErrors.join(', '), success: false }
  }
  try {
    const invoiceData = rawData.invoice === 'true' ? {
      companyName: rawData.invoiceCompany,
      nip: rawData.invoiceNip,
      street: rawData.invoiceStreet,
      city: rawData.invoiceCity,
      postalCode: rawData.invoicePostalCode,
    } : undefined
    const totalPrice = Number(rawData.totalPrice)
    const paidAmount = Number(rawData.paidAmount)
    const paymentStatus = calculatePaymentStatus(totalPrice, paidAmount)
    const allowCheckinOnDepartureDay = ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY
    const propertyId = rawData.propertyId as string
    const startDate = new Date(rawData.startDate as string)
    const endDate = new Date(rawData.endDate as string)

    if (!Types.ObjectId.isValid(propertyId)) {
      return { message: 'Nieprawidłowy identyfikator obiektu.', success: false }
    }

    const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

    const overlappingBookings = await Booking.find({
      propertyId: new Types.ObjectId(propertyId),
      ...AVAILABILITY_STATUS_FILTER,
      ...overlapFilter,
    })
      .select('_id propertyId status createdAt stripeSessionId source adminNotes')
      .lean()

    const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings)

    const existingConflict = occupiedPropertyIds.size > 0

    if (existingConflict) {
      return { message: 'Wybrany termin koliduje z istniejącą rezerwacją lub blokadą.', success: false }
    }

    const newBooking = new Booking({
      orderId: await generateOrderId(),
      propertyId,
      startDate,
      endDate,
      guestName: rawData.guestName,
      guestEmail: rawData.guestEmail,
      guestPhone: rawData.guestPhone,
      adults: Number(rawData.numGuests),
      children: 0,
      numberOfGuests: Number(rawData.numGuests),
      extraBedsCount: Number(rawData.extraBeds),
      totalPrice,
      depositAmount: paidAmount,
      paidAmount,
      paymentStatus,
      status: 'confirmed',
      paymentMethod: 'transfer',
      invoice: rawData.invoice === 'true',
      invoiceData,
      customerNotes: rawData.internalNotes,
      source: 'admin',
    })
    await newBooking.save()
    revalidatePath('/admin/bookings')
    revalidatePath('/booking')
    return { message: 'Rezerwacja została pomyślnie utworzona!', success: true }
  } catch (error: any) {
    return { message: error.message || 'Wystąpił nieoczekiwany błąd serwera.', success: false }
  }
}

export async function updateBookingAction(prevState: any, formData: FormData) {
  await dbConnect()
  const rawData = Object.fromEntries(formData.entries())
  const bookingId = rawData.bookingId as string
  const validationErrors = validateBookingData(rawData)
  if (validationErrors.length > 0) {
    return { message: validationErrors.join(', '), success: false }
  }
  try {
    const invoiceData = rawData.invoice === 'true' ? {
      companyName: rawData.invoiceCompany,
      nip: rawData.invoiceNip,
      street: rawData.invoiceStreet,
      city: rawData.invoiceCity,
      postalCode: rawData.invoicePostalCode,
    } : undefined
    const totalPrice = Number(rawData.totalPrice)
    const paidAmount = Number(rawData.paidAmount)
    const paymentStatus = calculatePaymentStatus(totalPrice, paidAmount)
    const allowCheckinOnDepartureDay = ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY
    const propertyId = rawData.propertyId as string
    const startDate = new Date(rawData.startDate as string)
    const endDate = new Date(rawData.endDate as string)
    const status = rawData.status as string

    if (!Types.ObjectId.isValid(propertyId)) {
      return { message: 'Nieprawidłowy identyfikator obiektu.', success: false }
    }

    if (status === 'confirmed' || status === 'blocked') {
      const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

      const overlappingBookings = await Booking.find({
        _id: { $ne: bookingId },
        propertyId: new Types.ObjectId(propertyId),
        ...AVAILABILITY_STATUS_FILTER,
        ...overlapFilter,
      })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean()

      const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlappingBookings)

      const existingConflict = occupiedPropertyIds.size > 0

      if (existingConflict) {
        return { message: 'Wybrany termin koliduje z istniejącą rezerwacją lub blokadą.', success: false }
      }
    }

    const bookingData = {
      propertyId,
      startDate,
      endDate,
      guestName: rawData.guestName,
      guestEmail: rawData.guestEmail,
      guestPhone: rawData.guestPhone,
      adults: Number(rawData.numGuests),
      children: 0,
      numberOfGuests: Number(rawData.numGuests),
      extraBedsCount: Number(rawData.extraBeds),
      totalPrice,
      depositAmount: paidAmount,
      paidAmount,
      paymentStatus,
      status,
      paymentMethod: 'transfer',
      invoice: rawData.invoice === 'true',
      invoiceData,
      customerNotes: rawData.internalNotes,
    }
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, bookingData, { new: true })
    if (!updatedBooking) {
      return { message: 'Nie znaleziono rezerwacji do zaktualizowania.', success: false }
    }
    revalidatePath('/admin/bookings')
    revalidatePath('/booking')
    revalidatePath(`/admin/bookings/list/${bookingId}`)
    return { message: 'Rezerwacja została pomyślnie zaktualizowana!', success: true }
  } catch (error: any) {
    return { message: error.message || 'Wystąpił nieoczekiwany błąd serwera.', success: false }
  }
}

export async function deleteBookingAction(bookingId: string) {
  await dbConnect()
  try {
    const result = await Booking.findByIdAndDelete(bookingId)
    if (!result) {
      return { message: 'Nie znaleziono rezerwacji.', success: false }
    }
    revalidatePath('/admin/bookings')
    return { message: 'Rezerwacja została pomyślnie usunięta!', success: true }
  } catch (error: any) {
    return { message: error.message || 'Wystąpił nieoczekiwany błąd serwera.', success: false }
  }
}

export async function calculatePriceAction(
  params: {
    startDate: string
    endDate: string
    baseGuests: number
    extraBeds: number
    propertySelection: string
  }
): Promise<{ price: number }> {
  try {
    const price = await calculateTotalPrice({
      startDate: params.startDate,
      endDate: params.endDate,
      baseGuests: params.baseGuests,
      extraBeds: params.extraBeds,
      propertySelection: params.propertySelection
    });
    return { price }
  } catch (error) {
    console.error('Błąd podczas obliczania ceny:', error)
    return { price: 0 }
  }
}

export async function getUnavailableDatesForBlocking(propertyId: string): Promise<UnavailableDate[]> {
  await dbConnect()
  const allowCheckinOnDepartureDay = ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY

  if (!propertyId) return []

  const query: any = {
    ...AVAILABILITY_STATUS_FILTER,
  }

  if (propertyId !== ALL_PROPERTIES_ID) {
    if (!Types.ObjectId.isValid(propertyId)) return []
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookingsForCleanup = await Booking.find(query)
    .select('_id propertyId status createdAt stripeSessionId source adminNotes startDate endDate')
    .lean()

  const { didMutateBookings } = await resolveOccupiedPropertyIdsFromBookings(bookingsForCleanup)

  const bookings = didMutateBookings
    ? await Booking.find(query)
        .select('startDate endDate')
        .lean()
    : bookingsForCleanup

  const unavailableDates = new Set<string>()

  for (const booking of bookings) {
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      unavailableDates.add(d.toISOString().split('T')[0])
    }

    if (!allowCheckinOnDepartureDay) {
      unavailableDates.add(end.toISOString().split('T')[0])
    }
  }

  return Array.from(unavailableDates)
    .map(date => ({ date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export async function getBlockedBookings(propertyId?: string): Promise<BlockedBookingListItem[]> {
  await dbConnect()

  const query: any = { status: 'blocked' }
  if (propertyId && propertyId !== ALL_PROPERTIES_ID && Types.ObjectId.isValid(propertyId)) {
    query.propertyId = new Types.ObjectId(propertyId)
  }

  const bookings = await Booking.find(query)
    .sort({ startDate: 1, createdAt: -1 })
    .populate('propertyId', 'name')
    .lean()

  return bookings.map((booking: any) => ({
    _id: String(booking._id),
    propertyId: booking.propertyId?._id ? String(booking.propertyId._id) : String(booking.propertyId || ''),
    propertyName: booking.propertyId?.name || 'Domek',
    startDate: new Date(booking.startDate).toISOString(),
    endDate: new Date(booking.endDate).toISOString(),
    adminNotes: booking.adminNotes || '',
    createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
  }))
}

export async function createBlockedBookingByAdmin(data: BlockCreateInput) {
  try {
    await dbConnect()
    const allowCheckinOnDepartureDay = ADMIN_ALLOW_CHECKIN_ON_DEPARTURE_DAY

    if (!data.propertyId || !data.startDate || !data.endDate) {
      return { success: false, message: 'Wybierz domek oraz zakres dat.' }
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { success: false, message: 'Nieprawidłowy zakres dat.' }
    }

    if (endDate <= startDate) {
      return { success: false, message: 'Data końca blokady musi być późniejsza niż data początku.' }
    }

    let targetProperties: Array<{ _id: Types.ObjectId; name: string }> = []

    if (data.propertyId === ALL_PROPERTIES_ID) {
      const properties = await Property
        .find({ isActive: true })
        .select('name')
        .lean()

      targetProperties = properties.map((p: any) => ({ _id: p._id, name: p.name || 'Domek' }))
    } else {
      if (!Types.ObjectId.isValid(data.propertyId)) {
        return { success: false, message: 'Nieprawidłowy domek.' }
      }

      const property = await Property
        .findById(data.propertyId)
        .select('name')
        .lean()

      if (!property) {
        return { success: false, message: 'Nie znaleziono wybranego domku.' }
      }

      targetProperties = [{ _id: property._id, name: property.name || 'Domek' }]
    }

    if (targetProperties.length === 0) {
      return { success: false, message: 'Brak domków do zablokowania.' }
    }

    const conflictedProperties: string[] = []
    const overlapFilter = buildBookingOverlapFilter(startDate, endDate, allowCheckinOnDepartureDay)

    for (const property of targetProperties) {
      const overlapBookings = await Booking.find({
        propertyId: property._id,
        ...AVAILABILITY_STATUS_FILTER,
        ...overlapFilter,
      })
        .select('_id propertyId status createdAt stripeSessionId source adminNotes')
        .lean()

      const { occupiedPropertyIds } = await resolveOccupiedPropertyIdsFromBookings(overlapBookings)

      const conflict = occupiedPropertyIds.size > 0

      if (conflict) conflictedProperties.push(property.name)
    }

    if (conflictedProperties.length > 0) {
      return {
        success: false,
        message: `Zakres koliduje z istniejącą rezerwacją/blokadą: ${conflictedProperties.join(', ')}`,
      }
    }

    const docs = targetProperties.map((property) => ({
      propertyId: property._id,
      startDate,
      endDate,
      guestName: 'Zabl. przez admina',
      guestEmail: 'blokada@admin.local',
      guestPhone: '-',
      adults: 1,
      children: 0,
      numberOfGuests: 0,
      extraBedsCount: 0,
      totalPrice: 0,
      depositAmount: 0,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      status: 'blocked',
      paymentMethod: 'transfer',
      adminNotes: data.adminNotes?.trim() || 'Blokada terminu',
      source: 'admin',
    }))

    await Booking.insertMany(docs)

    revalidatePath('/admin/bookings/block')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/booking')

    return {
      success: true,
      message: targetProperties.length === 1
        ? 'Termin został zablokowany.'
        : `Terminy zostały zablokowane dla ${targetProperties.length} domków.`,
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Wystąpił błąd podczas blokowania terminu.' }
  }
}

export async function deleteBlockedBookingByAdmin(bookingId: string) {
  try {
    await dbConnect()

    if (!Types.ObjectId.isValid(bookingId)) {
      return { success: false, message: 'Nieprawidłowe ID blokady.' }
    }

    const deleted = await Booking.findOneAndDelete({
      _id: new Types.ObjectId(bookingId),
      status: 'blocked',
    })

    if (!deleted) {
      return { success: false, message: 'Nie znaleziono blokady do usunięcia.' }
    }

    revalidatePath('/admin/bookings/block')
    revalidatePath('/admin/bookings/calendar')
    revalidatePath('/admin/bookings/list')
    revalidatePath('/booking')

    return { success: true, message: 'Blokada została usunięta.' }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Wystąpił błąd podczas usuwania blokady.' }
  }
}