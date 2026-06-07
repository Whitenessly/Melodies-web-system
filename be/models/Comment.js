import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
