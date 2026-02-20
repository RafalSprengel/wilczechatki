import mongoose, { Schema, Document, Types } from 'mongoose';

interface ISystemConfigDoc extends Omit<Document, '_id'> {
  _id: string;
  autoBlockOtherCabins: boolean;
  highSeasonStart?: Date;
  highSeasonEnd?: Date;
  maxGuestsPerCabin: number;
  childrenFreeAgeLimit: number;
}

export type ISystemConfig = ISystemConfigDoc;

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    _id: { 
      type: String, 
      default: 'main' 
    },
    autoBlockOtherCabins: { type: Boolean, default: true },
    highSeasonStart: { type: Date },
    highSeasonEnd: { type: Date },
    maxGuestsPerCabin: { type: Number, default: 6 },
    childrenFreeAgeLimit: { type: Number, default: 13 }
  },
  {
    versionKey: false
  }
);

const SystemConfig = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

export default SystemConfig;