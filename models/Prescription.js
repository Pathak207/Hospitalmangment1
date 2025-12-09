import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const MedicationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
  },
  instructions: {
    type: String,
    required: false,
  },
  refills: {
    type: Number,
    default: 0,
  }
});

const PrescriptionSchema = new Schema({
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
  prescriptionId: {
    type: String,
    required: [true, 'Prescription ID is required'],
    unique: true
  },
  prescriptionDate: {
    type: Date,
    default: Date.now,
  },
  medications: {
    type: [MedicationSchema],
    required: [true, 'At least one medication is required'],
    validate: {
      validator: function(medications) {
        return medications.length > 0;
      },
      message: 'At least one medication is required'
    }
  },
  diagnosis: {
    type: String,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Discontinued', 'Completed', 'Pending'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema); 