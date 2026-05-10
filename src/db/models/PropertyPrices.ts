import mongoose, { Schema, Document } from 'mongoose';

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

export interface IPropertyPrices extends Document {
  propertyId: mongoose.Types.ObjectId;
  seasonId: mongoose.Types.ObjectId | null; // null = poza sezonem (basicPrices)
  weekdayPrices: IPriceTier[];
  weekendPrices: IPriceTier[];
  weekdayExtraBedPrice: number;
  weekendExtraBedPrice: number;
}

const PriceTierSchema = new Schema(
  {
    minGuests: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const PropertyPricesSchema = new Schema<IPropertyPrices>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    // null oznacza "ceny poza sezonem" (dawne basicPrices)
    seasonId: { type: Schema.Types.ObjectId, ref: 'Season', default: null },
    weekdayPrices: { type: [PriceTierSchema], required: true, default: [] },
    weekendPrices: { type: [PriceTierSchema], required: true, default: [] },
    weekdayExtraBedPrice: { type: Number, default: 50 },
    weekendExtraBedPrice: { type: Number, default: 70 },
  },
  { timestamps: true }
);

// Jeden rekord per obiekt + sezon. null obsługiwany przez sparse=false (domyślnie).
PropertyPricesSchema.index({ propertyId: 1, seasonId: 1 }, { unique: true });
// Szybkie wyszukiwanie wszystkich cen dla sezonu (używane przy kasowaniu sezonu)
PropertyPricesSchema.index({ seasonId: 1 });

export default mongoose.models.PropertyPrices ||
  mongoose.model<IPropertyPrices>('PropertyPrices', PropertyPricesSchema);