import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  rating: { type: Number, default: 5 },
  timestamp_seconds: { type: Number, default: 0 }, // seconds into song where comment is left
  status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
