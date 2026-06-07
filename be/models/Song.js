import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  genre: { type: String, required: true },
  audioUrl: { type: String, required: true }, // URL path (e.g. /uploads/songs/...)
  thumbnailUrl: { type: String, required: true }, // Image path
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  lyrics: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  moderationState: { type: String, enum: ['pending', 'approved', 'blocked'], default: 'approved' }
}, { timestamps: true });

const Song = mongoose.model('Song', songSchema);
export default Song;
