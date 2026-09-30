import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  publisher: { type: String, default: 'Unknown' },
  publishedAt: Date,
  snippet: String,
  sourceType: { type: String, default: 'rss' }
}, { timestamps: true });

export default mongoose.model('Source', sourceSchema);
