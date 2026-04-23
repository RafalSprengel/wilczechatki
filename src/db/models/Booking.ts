import mongoose, { Schema, Document } from 'mongoose';
import {
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  STRIPE_SESSION_STATUSES,
  type BookingStatus,
  type PaymentMethod,
  type PaymentStatus,
  type StripeSessionStatus,
} from '@/types/bookingStatus';

export interface IBooking extends Document {
  propertyId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  orderId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress?: string;
  adults: number;
  children: number;
  extraBedsCount: number;
  totalPrice: number;
  depositAmount: number;
  paidAmount: number;
  stripeSessionId?: string;
  stripeSessionStatus?: StripeSessionStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  invoice?: boolean;
  invoiceData?: {
    companyName?: string;
    nip?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  };
  customerNotes?: string;
  adminNotes?: string;
  source: 'online' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  orderId: {
    type: String,
    trim: true,
    index: true
  },
  guestName: {
    type: String,
    required: true,
    trim: true
  },
  guestEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  guestPhone: {
    type: String,
    required: true,
    trim: true
  },
  guestAddress: {
    type: String,
    trim: true
  },
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0,
    min: 0
  },
  extraBedsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  stripeSessionId: {
    type: String,
    trim: true
  },
  stripeSessionStatus: {
    type: String,
    enum: STRIPE_SESSION_STATUSES,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'unpaid'
  },
  status: {
    type: String,
    enum: BOOKING_STATUSES,
    default: 'pending'
  },
  invoice: {
    type: Boolean,
    default: false
  },
  invoiceData: {
    companyName: { type: String, trim: true },
    nip: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  customerNotes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['online', 'admin'],
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS,
    default: 'online'
  }
}, {
  timestamps: true
});

BookingSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000,
    partialFilterExpression: {
      status: 'failed',
      source: 'online'
    }
  }
);

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);