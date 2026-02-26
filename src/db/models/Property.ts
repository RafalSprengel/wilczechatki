import mongoose, { Schema, Document } from 'mongoose';
export interface IProperty extends Document {
  name: string;
  slug?: string;
  description?: string;
  baseCapacity: number;
  maxCapacityWithExtra: number;
  images?: string[];
  isActive: boolean;
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
    default: 4
  },
  maxCapacityWithExtra: {
    type: Number,
    required: true,
    default: 6
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);