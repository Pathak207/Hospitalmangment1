import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const VitalsSchema = new Schema({
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
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who recorded vitals is required'],
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: [true, 'Systolic blood pressure is required'],
    },
    diastolic: {
      type: Number,
      required: [true, 'Diastolic blood pressure is required'],
    },
  },
  heartRate: {
    type: Number,
    required: [true, 'Heart rate is required'],
  },
  respiratoryRate: {
    type: Number,
    required: false,
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
  },
  oxygenSaturation: {
    type: Number,
    required: false,
  },
  height: {
    type: Number,
    required: false,
  },
  weight: {
    type: Number,
    required: false,
  },
  bmi: {
    type: Number,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
});

export default mongoose.models.Vitals || mongoose.model('Vitals', VitalsSchema); 