import mongoose, { Schema, Document } from 'mongoose';

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
  componentPropertyIds: {
    type: [Schema.Types.ObjectId],
    ref: 'Property'
  }
}, {
  timestamps: true,
});

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);