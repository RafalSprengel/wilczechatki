import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  propertyId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress?: string;
  numberOfGuests: number;
  extraBedsCount: number;
  totalPrice: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'blocked';
  bookingType: 'real' | 'shadow';
  linkedBookingId?: mongoose.Types.ObjectId;
  invoice?: boolean;
  invoiceData?: {
    companyName?: string;
    nip?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  };
  notes?: string;
  source?: string;
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
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
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
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'blocked'],
    default: 'pending'
  },
  bookingType: {
    type: String,
    enum: ['real', 'shadow'],
    default: 'real'
  },
  linkedBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
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
  notes: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

BookingSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ bookingType: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);