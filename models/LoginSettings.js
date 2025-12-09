import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const LoginSettingsSchema = new Schema({
  // Organization reference for multi-tenancy (optional for global settings)
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Allow null for global settings managed by super admin
    default: null,
  },
  pageTitle: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    required: true,
  },
  footerText: {
    type: String,
    required: true,
  },
  sidePanelTitle: {
    type: String,
    required: true,
  },
  sidePanelDescription: {
    type: String,
    required: true,
  },
  features: {
    type: [String],
    required: true,
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
LoginSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.LoginSettings || mongoose.model('LoginSettings', LoginSettingsSchema); 