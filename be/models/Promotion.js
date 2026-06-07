import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional, null if system-wide
  title: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  discountPercent: { type: Number, default: 0 }
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
