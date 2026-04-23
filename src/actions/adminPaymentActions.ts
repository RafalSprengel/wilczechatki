'use server'

import { revalidatePath } from 'next/cache'
import Stripe from 'stripe'
import dbConnect from '@/db/connection'
import Booking from '@/db/models/Booking'
import { stripe } from '@/lib/stripe'
import type { PaymentMethod } from '@/types/bookingStatus'
import { Types } from 'mongoose'

export type AdminPaymentStatus = 'pending' | 'confirmed' | 'failed'
export type AdminPaymentTab = 'online' | 'offline'

export interface AdminPaymentRow {
  id: string
  orderId?: string
  createdAt: string
  guestName: string
  totalPrice: number
  paymentMethod: PaymentMethod
  status: string
  stripeSessionId?: string
}

export interface AdminPaymentsData {
  online: AdminPaymentRow[]
  offline: AdminPaymentRow[]
  stalePendingCount: number
}

function normalizePaymentRow(row: any): AdminPaymentRow {
  if (!row._id) {
    throw new Error('Brak identyfikatora rezerwacji podczas mapowania płatności.')
  }

  if (!row.createdAt) {
    throw new Error('Brak daty utworzenia rezerwacji podczas mapowania płatności.')
  }

  if (typeof row.guestName !== 'string' || row.guestName.trim().length === 0) {
    throw new Error('Brak poprawnej nazwy klienta podczas mapowania płatności.')
  }

  if (typeof row.totalPrice !== 'number') {
    throw new Error('Brak poprawnej kwoty rezerwacji podczas mapowania płatności.')
  }

  if (row.paymentMethod !== 'online' && row.paymentMethod !== 'cash' && row.paymentMethod !== 'transfer') {
    throw new Error('Brak poprawnej metody płatności podczas mapowania płatności.')
  }

  if (typeof row.status !== 'string') {
    throw new Error('Brak poprawnego statusu podczas mapowania płatności.')
  }

  const mapped: AdminPaymentRow = {
    id: String(row._id),
    createdAt: new Date(row.createdAt).toISOString(),
    guestName: row.guestName,
    totalPrice: row.totalPrice,
    paymentMethod: row.paymentMethod,
    status: row.status,
  }

  if (typeof row.orderId === 'string' && row.orderId.trim().length > 0) {
    mapped.orderId = row.orderId
  }

  if (typeof row.stripeSessionId === 'string' && row.stripeSessionId.trim().length > 0) {
    mapped.stripeSessionId = row.stripeSessionId
  }

  return mapped
}

export async function getAdminPaymentsData(): Promise<AdminPaymentsData> {
  await dbConnect()

  const staleDateThreshold = new Date(Date.now() - 15 * 60 * 1000)

  const [onlineRows, offlineRows, stalePendingCount] = await Promise.all([
    Booking.find({
      source: 'online',
      status: { $in: ['pending', 'confirmed', 'failed'] },
    })
      .select('orderId createdAt guestName totalPrice paymentMethod status stripeSessionId')
      .sort({ createdAt: -1 })
      .lean(),
    Booking.find({
      paymentMethod: { $in: ['cash', 'transfer'] },
      status: { $in: ['pending', 'confirmed', 'failed'] },
    })
      .select('createdAt guestName totalPrice paymentMethod status')
      .sort({ createdAt: -1 })
      .lean(),
    Booking.countDocuments({
      source: 'online',
      status: 'pending',
      createdAt: { $lte: staleDateThreshold },
    }),
  ])

  return {
    online: onlineRows.map(normalizePaymentRow),
    offline: offlineRows.map(normalizePaymentRow),
    stalePendingCount,
  }
}

export async function syncOnlinePaymentAction(bookingId: string): Promise<{
  ok: boolean
  level: 'success' | 'info' | 'error'
  message: string
}> {
  try {
    await dbConnect()

    if (!Types.ObjectId.isValid(bookingId)) {
      return { ok: false, level: 'error', message: 'Nieprawidłowe ID rezerwacji.' }
    }

    const booking = await Booking.findById(bookingId)
      .select('status source stripeSessionId')
      .lean()

    if (!booking) {
      return { ok: false, level: 'error', message: 'Nie znaleziono rezerwacji do synchronizacji.' }
    }

    if (booking.source !== 'online') {
      return { ok: false, level: 'error', message: 'Synchronizacja Stripe jest dostępna tylko dla płatności online.' }
    }

    if (booking.status !== 'pending') {
      return { ok: false, level: 'info', message: 'Ta płatność nie ma statusu oczekującego.' }
    }

    if (typeof booking.stripeSessionId !== 'string' || booking.stripeSessionId.trim().length === 0) {
      return { ok: false, level: 'error', message: 'Brak stripeSessionId dla tej rezerwacji.' }
    }

    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)

    if (session.payment_status === 'paid') {
      await Booking.updateMany(
        {
          stripeSessionId: booking.stripeSessionId,
          source: 'online',
          status: 'pending',
        },
        {
          $set: {
            status: 'confirmed',
            paymentStatus: 'paid',
          },
        }
      )

      revalidatePath('/admin')
      revalidatePath('/admin/bookings/calendar')
      revalidatePath('/admin/bookings/list')
      revalidatePath('/admin/payments')
      revalidatePath('/booking')

      return { ok: true, level: 'success', message: 'Płatność potwierdzona. Rezerwacja została oznaczona jako confirmed i paid.' }
    }

    if (session.status === 'expired') {
      await Booking.updateMany(
        {
          stripeSessionId: booking.stripeSessionId,
          source: 'online',
          status: 'pending',
        },
        {
          $set: {
            status: 'failed',
          },
        }
      )

      revalidatePath('/admin')
      revalidatePath('/admin/bookings/calendar')
      revalidatePath('/admin/bookings/list')
      revalidatePath('/admin/payments')
      revalidatePath('/booking')

      return { ok: true, level: 'success', message: 'Sesja Stripe wygasła. Rezerwacja została oznaczona jako failed.' }
    }

    if (session.status === 'open') {
      return { ok: true, level: 'info', message: 'Klient wciąż ma otwarte okno płatności.' }
    }

    return {
      ok: false,
      level: 'error',
      message: `Nieobsługiwany status sesji Stripe: ${session.status} / payment_status: ${session.payment_status}.`,
    }
  } catch (error: unknown) {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        ok: false,
        level: 'error',
        message: `Stripe: ${error.message}`,
      }
    }

    if (error instanceof Error) {
      return { ok: false, level: 'error', message: error.message }
    }

    return { ok: false, level: 'error', message: 'Wystąpił nieznany błąd podczas synchronizacji ze Stripe.' }
  }
}
