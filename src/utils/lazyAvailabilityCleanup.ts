import Booking from '@/db/models/Booking';
import { stripe } from '@/lib/stripe';
import type { StripeSessionStatus } from '@/types/bookingStatus';

const PENDING_MAX_AGE_MS = 30 * 60 * 1000; //30 minutes block for pending bookings without recent activity (creation or stripe session updates)

type SessionDecision = 'occupied' | 'free' | 'unknown';

interface AvailabilityBookingRecord {
  _id: string;
  propertyId: string;
  status: string;
  createdAt: Date | string;
  stripeSessionId: string;
  source: string;
  adminNotes?: string;
}

interface ResolveOccupiedResult {
  occupiedPropertyIds: Set<string>;
  didMutateBookings: boolean;
}

function mapStripeSessionStatus(status: string | null): StripeSessionStatus {
  if (status === 'open') return 'open';
  if (status === 'complete') return 'complete';
  if (status === 'expired') return 'expired';
  return 'unknown';
}

function buildNextAdminNotes(currentNotes: string | undefined, reason: string): string {
  const current = typeof currentNotes === 'string' ? currentNotes : '';
  const entry = `[LazyCleanup ${new Date().toISOString()}] Stripe verification error: ${reason}`;

  
  if (current.length === 0) {
    return entry;
  }

  return `${current}\n${entry}`;
}

async function setUnknownWithNotesBySessionId(stripeSessionId: string, reason: string): Promise<void> {
  const bookings = await Booking.find({
    stripeSessionId,
    source: 'online',
    status: 'pending',
  })
    .select('_id adminNotes')
    .lean();

  for (const booking of bookings) {
    if (!booking._id) {
      throw new Error('Brak identyfikatora rezerwacji podczas aktualizacji statusu unknown.');
    }

    const nextAdminNotes = buildNextAdminNotes(booking.adminNotes, reason);

    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          stripeSessionStatus: 'unknown',
          adminNotes: nextAdminNotes,
        },
      }
    );
  }
}

async function setUnknownForPendingBooking(bookingId: unknown, reason: string): Promise<void> {
  const currentBooking = await Booking.findById(bookingId)
    .select('adminNotes')
    .lean();

  if (!currentBooking) {
    return;
  }

  const nextAdminNotes = buildNextAdminNotes(currentBooking.adminNotes, reason);

  await Booking.updateOne(
    { _id: bookingId },
    {
      $set: {
        stripeSessionStatus: 'unknown',
        adminNotes: nextAdminNotes,
      },
    }
  );
}

export async function resolveOccupiedPropertyIdsFromBookings(
  bookings: AvailabilityBookingRecord[]
): Promise<ResolveOccupiedResult> {
  const occupiedPropertyIds = new Set<string>();
  const decisionBySession = new Map<string, SessionDecision>();
  let didMutateBookings = false;

  for (const booking of bookings) {
    const propertyId = booking.propertyId;

    if (booking.status === 'blocked' || booking.status === 'confirmed') {
      occupiedPropertyIds.add(propertyId);
      continue;
    }

    if (booking.status !== 'pending') {
      continue;
    }

    const pendingAgeMs = Date.now() - new Date(booking.createdAt).getTime(); 

    if (pendingAgeMs < PENDING_MAX_AGE_MS) {
      occupiedPropertyIds.add(propertyId);
      continue;
    }
    
    const stripeSessionId = booking.stripeSessionId;
    const cachedDecision = decisionBySession.get(stripeSessionId);

    if (cachedDecision === 'occupied' || cachedDecision === 'unknown') {
      occupiedPropertyIds.add(propertyId);
      continue;
    }

    if (cachedDecision === 'free') {
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      const mappedSessionStatus = mapStripeSessionStatus(session.status);

      if (session.status === 'complete') {
        await Booking.updateMany(
          {
            stripeSessionId,
            source: 'online',
            status: 'pending',
          },
          {
            $set: {
              status: 'confirmed',
              paymentStatus: 'paid',
              stripeSessionStatus: 'complete',
            },
          }
        );
        didMutateBookings = true;
        decisionBySession.set(stripeSessionId, 'occupied');
        occupiedPropertyIds.add(propertyId);
        continue;
      }

      if (session.status === 'open') {
        await stripe.checkout.sessions.expire(stripeSessionId);
      }

      if (session.status === 'expired' || session.status === 'open') {
        await Booking.updateMany(
          {
            stripeSessionId,
            source: 'online',
            status: 'pending',
          },
          {
            $set: {
              status: 'failed',
              stripeSessionStatus: 'expired',
            },
          }
        );
        didMutateBookings = true;
        decisionBySession.set(stripeSessionId, 'free');
        continue;
      }

      await Booking.updateMany(
        {
          stripeSessionId,
          source: 'online',
          status: 'pending',
        },
        {
          $set: {
            stripeSessionStatus: mappedSessionStatus,
          },
        }
      );
      didMutateBookings = true;
      decisionBySession.set(stripeSessionId, 'unknown');
      occupiedPropertyIds.add(propertyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd Stripe.';
      await setUnknownWithNotesBySessionId(stripeSessionId, errorMessage);
      didMutateBookings = true;
      decisionBySession.set(stripeSessionId, 'unknown');
      occupiedPropertyIds.add(propertyId);
    }
  }

  return {
    occupiedPropertyIds,
    didMutateBookings,
  };
}
