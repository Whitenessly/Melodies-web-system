import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  planId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'canceled'], default: 'pending' },
  stripePaymentIntentId: { type: String, unique: true },
  stripeInvoiceId: { type: String },
  paymentMethod: {
    type: { type: String }, // 'card', 'bank_transfer', etc
    last4: { type: String },
    brand: { type: String }
  },
  description: { type: String },
  receiptUrl: { type: String }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
