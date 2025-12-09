import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const AppointmentSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required'],
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'No-show'],
    default: 'Pending',
  },
  duration: {
    type: String,
    default: '30 min',
  },
  notes: {
    type: String,
  },
  fee: {
    type: Number,
    default: 0,
  },
  alerts: {
    type: [String],
    default: [],
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

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema); 