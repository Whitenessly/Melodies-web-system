import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true }, // 'basic', 'pro', 'premium'
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // in cents
  currency: { type: String, default: 'usd' },
  interval: { type: String, enum: ['month', 'year'], default: 'month' },
  stripePriceId: { type: String },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
