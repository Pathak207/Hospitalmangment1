import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const PaymentSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  appointment: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false, // Not required for manual entries
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: false, // Changed from required: true to allow subscription payments without specific patient
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
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
    enum: ['Card', 'Cash', 'Check'],
    required: [true, 'Payment method is required'],
  },
  cardType: {
    type: String,
    enum: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Other', ''],
    default: '',
  },
  lastFourDigits: {
    type: String,
    maxlength: 4,
    default: '',
  },
  transactionId: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Appointment', 'Laboratory', 'Medical Procedure', 'Medical Supplies', 'Consultation Fee', 'Other'],
    default: 'Appointment',
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Failed'],
    default: 'Completed',
  },
  receiptSent: {
    type: Boolean,
    default: false,
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
PaymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    try {
      const count = await mongoose.models.Payment.countDocuments();
      this.transactionId = `PMT-${new Date().getFullYear()}-${(10000 + count + 1).toString()}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 