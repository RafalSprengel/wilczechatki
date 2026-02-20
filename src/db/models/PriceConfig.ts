import mongoose, { Schema, Document } from 'mongoose';

interface IRateTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

interface IBaseRates {
  weekday: IRateTier[];
  weekend: IRateTier[];
  extraBedPrice: number;
  childrenFreeAgeLimit: number;
}

interface ISeason {
  name: string;
  startDate: Date;
  endDate: Date;
  weekday: IRateTier[];
  weekend: IRateTier[];
  extraBedPrice?: number; // Jeśli nie podano, używa ceny bazowej
  isActive: boolean;
}

export interface IPriceConfig extends Document {
  _id: string; // Zawsze 'main'
  baseRates: IBaseRates;
  seasons: ISeason[];
  updatedAt: Date;
}

const RateTierSchema = new Schema<IRateTier>({
  minGuests: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const BaseRatesSchema = new Schema<IBaseRates>({
  weekday: { type: [RateTierSchema], required: true },
  weekend: { type: [RateTierSchema], required: true },
  extraBedPrice: { type: Number, default: 50, min: 0 },
  childrenFreeAgeLimit: { type: Number, default: 13 }
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
  baseRates: { 
    type: BaseRatesSchema, 
    required: true,
    default: {
      weekday: [
        { minGuests: 2, maxGuests: 3, price: 300 },
        { minGuests: 4, maxGuests: 5, price: 400 },
        { minGuests: 6, maxGuests: 10, price: 500 }
      ],
      weekend: [
        { minGuests: 2, maxGuests: 3, price: 400 },
        { minGuests: 4, maxGuests: 5, price: 500 },
        { minGuests: 6, maxGuests: 10, price: 600 }
      ],
      extraBedPrice: 50,
      childrenFreeAgeLimit: 13
    }
  },
  seasons: { type: [SeasonSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.PriceConfig || mongoose.model<IPriceConfig>('PriceConfig', PriceConfigSchema);