import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const ClinicalNoteSchema = new Schema({
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
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  type: {
    type: String,
    enum: ['Progress Note', 'Consultation', 'Procedure Note', 'Discharge Summary', 'History and Physical', 'Other'],
    required: [true, 'Note type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  diagnosis: {
    type: [String],
    default: [],
  },
  assessment: {
    type: String,
    required: false,
  },
  plan: {
    type: String,
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
  tags: {
    type: [String],
    default: [],
  },
  private: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.ClinicalNote || mongoose.model('ClinicalNote', ClinicalNoteSchema); 