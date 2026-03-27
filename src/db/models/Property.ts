import mongoose, { Schema, Document } from 'mongoose';

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface ISeasonRates {
  name?: string;
  weekday: IPriceTier[];
  weekend: IPriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

export interface IProperty extends Document {
  name: string;
  slug?: string;
  description?: string;
  baseCapacity: number;
  maxExtraBeds: number;
  images?: string[];
  isActive: boolean;
  type: 'single' | 'whole';
  basicPrices?: {
    weekdayPrices: IPriceTier[];
    weekendPrices: IPriceTier[];
    weekdayExtraBedPrice: number;
    weekendExtraBedPrice: number;
  };
}

const PropertySchema = new Schema<IProperty>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  baseCapacity: {
    type: Number,
    required: true,
    default: 6
  },
  maxExtraBeds: {
    type: Number,
    required: true,
    default: 2
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['single', 'whole'],
    default: 'single'
  },
  basicPrices: {
    type: {
      weekdayPrices: [{
        minGuests: { type: Number, required: true },
        maxGuests: { type: Number, required: true },
        price: { type: Number, required: true }
      }],
      weekendPrices: [{
        minGuests: { type: Number, required: true },
        maxGuests: { type: Number, required: true },
        price: { type: Number, required: true }
      }],
      weekdayExtraBedPrice: { type: Number, default: 50 },
      weekendExtraBedPrice: { type: Number, default: 70 }
    },
    default: undefined
  }
}, {
  timestamps: true,
});

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);