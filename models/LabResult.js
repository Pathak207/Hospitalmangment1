import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const LabResultSchema = new Schema({
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
  orderedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who ordered the lab is required'],
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
  },
  category: {
    type: String,
    required: [true, 'Test category is required'],
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  orderedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    required: false,
  },
  results: {
    type: Map,
    of: {
      value: String,
      unit: String,
      referenceRange: String,
      flag: {
        type: String,
        enum: ['Normal', 'Low', 'High', 'Critical Low', 'Critical High', ''],
        default: '',
      },
    },
    default: {},
  },
  resultSummary: {
    type: String,
    required: false,
  },
  attachmentUrl: {
    type: String,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  urgency: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine',
  },
});

export default mongoose.models.LabResult || mongoose.model('LabResult', LabResultSchema); 