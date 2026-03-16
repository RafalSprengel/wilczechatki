import mongoose, { Schema } from 'mongoose';

export interface IBookingConfig {
  _id: string;
  minBookingDays: number;
  maxBookingDays: number;
  highSeasonStart?: Date;
  highSeasonEnd?: Date;
  childrenFreeAgeLimit: number;
  allowCheckinOnDepartureDay: boolean;
  checkInHour: number;
  checkOutHour: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingConfigSchema = new Schema<IBookingConfig>({
  _id: { type: String, default: 'main' },
  minBookingDays: { type: Number, default: 1, min: 1 },
  maxBookingDays: { type: Number, default: 30, min: 1 },
  highSeasonStart: { type: Date },
  highSeasonEnd: { type: Date },
  childrenFreeAgeLimit: { type: Number, default: 13 },
  allowCheckinOnDepartureDay: { type: Boolean, default: true },
  checkInHour: { type: Number, default: 15, min: 0, max: 23 },
  checkOutHour: { type: Number, default: 12, min: 0, max: 23 },
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.BookingConfig || mongoose.model<IBookingConfig>('BookingConfig', BookingConfigSchema);