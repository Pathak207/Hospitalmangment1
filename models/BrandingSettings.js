import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const BrandingSettingsSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  appName: {
    type: String,
    required: true,
    default: 'DoctorCare'
  },
  appTagline: {
    type: String,
    required: true,
    default: 'Practice Management'
  },
  logoText: {
    type: String,
    required: true,
    default: 'DC'
  },
  footerText: {
    type: String,
    required: true,
    default: 'DoctorCare. All rights reserved.'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
BrandingSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.BrandingSettings || mongoose.model('BrandingSettings', BrandingSettingsSchema); 