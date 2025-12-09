import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const SubscriptionPlanSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  // Pricing
  monthlyPrice: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: [0, 'Price cannot be negative'],
  },
  yearlyPrice: {
    type: Number,
    required: [true, 'Yearly price is required'],
    min: [0, 'Price cannot be negative'],
  },
  // Stripe integration
  stripePriceIdMonthly: {
    type: String,
    required: false,
  },
  stripePriceIdYearly: {
    type: String,
    required: false,
  },
  // Plan features and limits
  features: {
    maxPatients: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    maxUsers: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    maxAppointments: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    customBranding: {
      type: Boolean,
      default: false,
    },
    apiAccess: {
      type: Boolean,
      default: false,
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    advancedReports: {
      type: Boolean,
      default: false,
    },
    dataBackup: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
  // Plan status
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  // Display order
  sortOrder: {
    type: Number,
    default: 0,
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
SubscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ sortOrder: 1 });

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema); 