import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const SubscriptionSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: false, // Allow null for trial-only subscriptions
  },
  // Subscription details
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'unpaid', 'trialing'],
    default: 'active',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: [true, 'Billing cycle is required'],
  },
  // Pricing information
  amount: {
    type: Number,
    required: [true, 'Subscription amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  trialEndDate: {
    type: Date,
    required: false,
  },
  // Stripe integration
  stripeSubscriptionId: {
    type: String,
    required: false,
  },
  stripeCustomerId: {
    type: String,
    required: false,
  },
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['stripe', 'manual', 'cash'],
    default: 'stripe',
  },
  lastPaymentDate: {
    type: Date,
    required: false,
  },
  nextPaymentDate: {
    type: Date,
    required: false,
  },
  // Usage tracking
  usage: {
    patients: {
      type: Number,
      default: 0,
    },
    users: {
      type: Number,
      default: 0,
    },
    appointments: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  // Subscription management
  autoRenew: {
    type: Boolean,
    default: true,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  cancelledAt: {
    type: Date,
    required: false,
  },
  cancelReason: {
    type: String,
    required: false,
  },
  // Admin notes
  notes: {
    type: String,
    required: false,
  },
  createdBy: {
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
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if subscription is expired
SubscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date();
});

// Virtual for checking if subscription is active
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Virtual for days remaining
SubscriptionSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Index for better performance
SubscriptionSchema.index({ organization: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema); 