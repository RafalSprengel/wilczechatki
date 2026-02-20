import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  slug: string;
  baseCapacity: number;
  maxCapacityWithExtra: number;
  description: string;
  images: string[];
  isActive: boolean;
}

const PropertySchema = new Schema<IProperty>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  baseCapacity: { type: Number, default: 6, min: 1 },
  maxCapacityWithExtra: { type: Number, default: 8 },
  description: { type: String, required: true },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);