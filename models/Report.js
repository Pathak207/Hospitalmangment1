import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  // Organization reference for multi-tenancy
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Clinical', 'Administrative', 'Operations', 'Compliance']
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Complete', 'In Progress', 'Scheduled']
  },
  insights: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Report || mongoose.model('Report', ReportSchema); 