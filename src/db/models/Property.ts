import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  slug?: string;
  description?: string;
  maxAdults: number;
  maxChildren: number;
  maxExtraBeds: number;
  images?: string[];
  isActive: boolean;
}

const PropertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    maxAdults: { type: Number, required: true, default: 6 },
    maxChildren: { type: Number, required: true, default: 6},
    maxExtraBeds: { type: Number, required: true, default: 2 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Property ||
  mongoose.model<IProperty>('Property', PropertySchema);