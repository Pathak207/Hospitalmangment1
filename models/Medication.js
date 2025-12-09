import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const MedicationSchema = new Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Global medications don't need organization
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
  },
  genericName: {
    type: String,
  },
  category: {
    type: String,
  },
  formulation: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical', 'Inhalation', 'Other'],
    required: [true, 'Medication formulation is required'],
  },
  strength: {
    type: String,
    required: [true, 'Medication strength is required'],
  },
  manufacturer: {
    type: String,
  },
  description: {
    type: String,
  },
  sideEffects: {
    type: [String],
    default: [],
  },
  contraindications: {
    type: [String],
    default: [],
  },
  interactions: {
    type: [String],
    default: [],
  },
  warnings: {
    type: [String],
    default: [],
  },
  commonDosages: {
    type: [String],
    default: [],
  },
  requiresPrescription: {
    type: Boolean,
    default: true,
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

export default mongoose.models.Medication || mongoose.model('Medication', MedicationSchema); 