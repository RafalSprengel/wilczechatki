import mongoose, { Schema, Document } from 'mongoose';

export interface IRateTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}


export interface ISeason {
  name: string;
  startDate: Date;
  endDate: Date;
  weekday: IRateTier[];
  weekend: IRateTier[];
  extraBedPrice?: number;
  isActive: boolean;
}

export interface IPriceConfig {
  _id: string;
  seasons: ISeason[];
  defaultWeekdayPrices?: IRateTier[];
  defaultWeekendPrices?: IRateTier[];
  defaultWeekdayExtraBedPrice?: number;
  defaultWeekendExtraBedPrice?: number;
  customPrices?: {
    propertyId: string;
    date: string;
    price: number;
  }[];
  updatedAt: Date;
}

const RateTierSchema = new Schema<IRateTier>({
  minGuests: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const SeasonSchema = new Schema<ISeason>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  weekday: { type: [RateTierSchema], required: true },
  weekend: { type: [RateTierSchema], required: true },
  extraBedPrice: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const PriceConfigSchema = new Schema<IPriceConfig>({
  _id: { type: String, default: 'main' },
  seasons: { type: [SeasonSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false,
  // strict: 'throw' // To spowoduje błąd przy zapisie nieznanych pól
});

export default mongoose.models.PriceConfig || mongoose.model<IPriceConfig>('PriceConfig', PriceConfigSchema);