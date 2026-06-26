import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  payment_gateway: { type: String, enum: ['momo', 'vnpay', 'stripe'], required: true },
  gateway_transaction_id: { type: String, default: null },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  completed_at: { type: Date, default: null }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
