import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const ActivitySchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  },
  type: {
    type: String,
    enum: ['appointment', 'lab', 'prescription', 'note', 'referral', 'critical_alert', 'system', 'vitals'],
    required: [true, 'Type is required'],
  },
  alert: {
    type: Boolean,
    default: false,
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Appointment', 'Patient', 'Task', 'User', 'Prescription', 'LabResult', 'ClinicalNote', 'Vitals'],
    },
    id: {
      type: Schema.Types.ObjectId,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema); 