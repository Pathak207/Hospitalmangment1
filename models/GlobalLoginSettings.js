import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const GlobalLoginSettingsSchema = new Schema({
  pageTitle: {
    type: String,
    required: true,
    default: 'Welcome to DoctorCare',
  },
  subtitle: {
    type: String,
    required: true,
    default: 'Your comprehensive practice management solution',
  },
  buttonText: {
    type: String,
    required: true,
    default: 'Sign In',
  },
  footerText: {
    type: String,
    required: true,
    default: 'DoctorCare. All rights reserved.',
  },
  sidePanelTitle: {
    type: String,
    required: true,
    default: 'Modern Healthcare Management',
  },
  sidePanelDescription: {
    type: String,
    required: true,
    default: 'Streamline your practice with our comprehensive management system designed for modern healthcare providers.',
  },
  features: {
    type: [String],
    required: true,
    default: [
      'Patient Management',
      'Appointment Scheduling',
      'Medical Records',
      'Billing & Payments'
    ],
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
GlobalLoginSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.GlobalLoginSettings || mongoose.model('GlobalLoginSettings', GlobalLoginSettingsSchema); 