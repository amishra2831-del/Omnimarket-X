import mongoose from 'mongoose';

const outcomeSchema = new mongoose.Schema({
  label: { type: String, required: true },
  description: String
}, { _id: false });

const validationSchema = new mongoose.Schema({
  severity: { type: String, enum: ['error', 'warning', 'info'], required: true },
  code: String,
  message: String
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  fingerprint: { type: String, unique: true, index: true },
  question: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  outcomes: { type: [outcomeSchema], default: [] },
  eventDate: Date,
  closingDate: Date,
  resolutionCriteria: { type: String, required: true },
  resolutionSource: { type: String, required: true },
  sourceLinks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }],
  status: {
    type: String,
    enum: ['discovered', 'needs_review', 'approved', 'rejected', 'created'],
    default: 'discovered',
    index: true
  },
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  validationIssues: { type: [validationSchema], default: [] },
  reviewerNote: String,
  createdMarket: {
    marketId: String,
    question: String,
    outcomes: [String],
    createdAt: Date
  }
}, { timestamps: true });

export default mongoose.model('Candidate', candidateSchema);
