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
  premium_status: { type: String, enum: ['FREE', 'PREMIUM'], default: 'FREE' },
  premium_expired_at: { type: Date, default: null },
  avatarUrl: { type: String, default: "" },
  stripeCustomerId: { type: String },
  paymentMethods: [{
    brand: { type: String },
    cardholderName: { type: String },
    last4: { type: String },
    expiry: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followersCount: { type: Number, default: 0 },
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  likedPlaylists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  recentlyPlayed: [recentlyPlayedSchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
