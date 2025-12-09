import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Organization email is required'],
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: false,
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  website: {
    type: String,
    required: false,
  },
  // Practice-specific fields
  taxId: {
    type: String,
    required: false,
  },
  dateFormat: {
    type: String,
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY'],
    default: 'MM/DD/YYYY',
  },
  // Organization settings
  timezone: {
    type: String,
    default: 'UTC',
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Subscription details
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false,
  },
  // Subscription type for special accounts
  subscriptionType: {
    type: String,
    enum: ['regular', 'unlimited'],
    default: 'regular',
  },
  // Stripe integration
  stripeCustomerId: {
    type: String,
    required: false,
  },
  // Organization status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Branding settings specific to organization
  branding: {
    appName: {
      type: String,
      default: 'DoctorCare'
    },
    appTagline: {
      type: String,
      default: 'Practice Management'
    },
    logoText: {
      type: String,
      default: 'DC'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
  },
  // Owner information
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
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
OrganizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ stripeCustomerId: 1 });

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema); 