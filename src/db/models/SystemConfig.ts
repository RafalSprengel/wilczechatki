import mongoose, { Schema, Document, Types } from 'mongoose';

interface ISystemConfigDoc extends Omit<Document, '_id'> {
  _id: string;
  autoBlockOtherCabins: boolean;
  onlyOnePropertyInSearchResult: boolean
}

export type ISystemConfig = ISystemConfigDoc;

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    _id: {
      type: String,
      default: 'main'
    },
    autoBlockOtherCabins: {
      type: Boolean,
      default: true
    },
    onlyOnePropertyInSearchResult: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    // strict: 'throw' // To spowoduje błąd przy zapisie nieznanych pól
  }
);

const SystemConfig = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

export default SystemConfig;