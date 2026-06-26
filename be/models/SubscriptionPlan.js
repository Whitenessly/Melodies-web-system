import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // in cents or whole dong (e.g. 59000 VND, or 1199 cents)
  currency: { type: String, default: 'usd' },
  interval: { type: String, default: 'month' },
  stripePriceId: { type: String, default: null },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
