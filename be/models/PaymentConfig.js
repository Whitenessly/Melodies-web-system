import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  gateway: { type: String, required: true, unique: true }, // 'momo', 'vnpay', 'stripe'
  merchantId: { type: String, default: "" },             // Momo / VNPay merchantId
  secretKey: { type: String, default: "" },              // Momo / VNPay / Stripe secretKey
  publishableKey: { type: String, default: "" }          // Stripe publishableKey
}, { timestamps: true });

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);
export default PaymentConfig;
