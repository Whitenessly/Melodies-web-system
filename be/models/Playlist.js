import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnailUrl: { type: String, default: "" },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  deleted_at: { type: Date, default: null }
}, { timestamps: true });

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
