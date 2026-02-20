import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  propertyId: mongoose.Types.ObjectId;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  numberOfGuests?: number;
  extraBedsCount?: number;
  status: 'confirmed' | 'blocked' | 'cancelled' | 'pending';
  bookingType: 'real' | 'shadow';
  linkedBookingId?: mongoose.Types.ObjectId;
  paymentId?: string;
}

const BookingSchema = new Schema<IBooking>({
  propertyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  guestName: { type: String },
  guestEmail: { type: String },
  guestPhone: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true, default: 0 },
  numberOfGuests: { type: Number, default: 0 },
  extraBedsCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['confirmed', 'blocked', 'cancelled', 'pending'], 
    default: 'pending' 
  },
  bookingType: {
    type: String,
    enum: ['real', 'shadow'],
    default: 'real'
  },
  linkedBookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  paymentId: { type: String }
}, { timestamps: true });

// Indeksy dla wydajności
BookingSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ bookingType: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);