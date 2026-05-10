import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettingsDoc extends Omit<Document, '_id'> {
  _id: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  facebookUrl: string;
  bankAccountNumber: string;
}

export type ISiteSettings = ISiteSettingsDoc;

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id: {
      type: String,
      default: 'main'
    },
    phoneDisplay: {
      type: String,
      required: true,
      default: '+48 000 000 000'
    },
    phoneHref: {
      type: String,
      required: true,
      default: '+48000000000'
    },
    email: {
      type: String,
      required: true,
      default: 'kontakt@example.com'
    },
    facebookUrl: {
      type: String,
      required: true,
      default: 'https://facebook.com'
    },
    bankAccountNumber: {
      type: String,
      required: true,
      default: '00 0000 0000 0000 0000 0000 0000'
    }
  },
  {
    versionKey: false,
  }
);

const SiteSettings = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;
