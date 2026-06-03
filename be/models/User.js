import mongoose from 'mongoose';

const recentlyPlayedSchema = new mongoose.Schema({
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  playedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['listener', 'artist', 'admin'], default: 'listener' },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  recentlyPlayed: [recentlyPlayedSchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
