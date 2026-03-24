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
interface IPriceConfiguration {
  season0: ISeasonRates;
  season1: ISeasonRates;
  season2: ISeasonRates;
  season3: ISeasonRates;
  season4: ISeasonRates;
  season5: ISeasonRates;
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
  componentPropertyIds?: mongoose.Types.ObjectId[];
  priceConfiguration?: IPriceConfiguration;
}

const PriceTierSchema = new Schema({
  minGuests: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const SeasonRatesSchema = new Schema({
  name: { type: String, default: '' },
  weekday: { type: [PriceTierSchema], default: [] },
  weekend: { type: [PriceTierSchema], default: [] },
  weekdayExtraBedPrice: { type: Number, default: 50 },
  weekendExtraBedPrice: { type: Number, default: 70 },
}, { _id: false });

const PriceConfigurationSchema = new Schema({
  season0: { type: SeasonRatesSchema, default: () => ({}) },
  season1: { type: SeasonRatesSchema, default: () => ({}) },
  season2: { type: SeasonRatesSchema, default: () => ({}) },
  season3: { type: SeasonRatesSchema, default: () => ({}) },
  season4: { type: SeasonRatesSchema, default: () => ({}) },
  season5: { type: SeasonRatesSchema, default: () => ({}) },
}, { _id: false });

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
  componentPropertyIds: {
    type: [Schema.Types.ObjectId],
    ref: 'Property'
  },
  priceConfiguration: {
    type: PriceConfigurationSchema,
    default: null
  }
}, {
  timestamps: true,
});

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);