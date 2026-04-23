export const STRIPE_SESSION_STATUSES = ['open', 'complete', 'expired', 'unknown'] as const;
export type StripeSessionStatus = (typeof STRIPE_SESSION_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'partial_paid', 'paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['online', 'cash', 'transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'blocked', 'failed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];