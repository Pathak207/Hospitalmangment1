import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const SubscriptionPaymentSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: [true, 'Subscription is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  currency: {
    type: String,
    default: 'USD',
  },
  description: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cash', 'manual', 'check'],
    required: [true, 'Payment method is required'],
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: [true, 'Billing cycle is required'],
  },
  transactionId: {
    type: String,
    default: '',
  },
  stripePaymentIntentId: {
    type: String,
    default: '',
  },
  stripeInvoiceId: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed',
  },
  // Who processed this payment (super admin for manual payments)
  processedBy: {
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

// Generate payment reference ID before saving
SubscriptionPaymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    try {
      const count = await mongoose.models.SubscriptionPayment.countDocuments();
      this.transactionId = `SUB-PMT-${new Date().getFullYear()}-${(10000 + count + 1).toString()}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.models.SubscriptionPayment || mongoose.model('SubscriptionPayment', SubscriptionPaymentSchema); 