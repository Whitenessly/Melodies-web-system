import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true }, // 'basic', 'pro', 'premium'
  status: { type: String, enum: ['active', 'canceled', 'expired', 'pending'], default: 'pending' },
  stripeSubscriptionId: { type: String, unique: true },
  stripeCustomerId: { type: String },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  features: {
    adFree: { type: Boolean, default: false },
    offlineDownload: { type: Boolean, default: false },
    highQuality: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    artistTools: { type: Boolean, default: false }
  }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
