import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['audio', 'banner'], required: true },
  clientName: { type: String, required: true },
  budgetLimit: { type: Number, required: true },
  budgetSpent: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  audioUrl: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  targetUrl: { type: String, default: "" },
  status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },
  location: { type: String, default: "Global" }
}, { timestamps: true });

const Ad = mongoose.model('Ad', adSchema);
export default Ad;
