import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const PatientSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  patientId: {
    type: String,
    required: [true, 'Patient ID is required'],
    // Removed global unique constraint - will use compound index instead
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
  },
  dob: {
    type: Date,
    required: false,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required'],
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
  },
  email: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  medicalHistory: {
    type: [String],
    default: [],
  },
  allergies: {
    type: [String],
    default: [],
  },
  medications: {
    type: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    default: [],
  },
  vitals: {
    bp: String,
    hr: String,
    temp: String,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
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

// Create compound index for patientId + organization (unique per organization)
PatientSchema.index({ patientId: 1, organization: 1 }, { unique: true });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema); 