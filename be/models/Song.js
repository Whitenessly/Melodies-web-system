import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true }, // Simple string representation
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featured_artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', default: null },
  duration: { type: Number, default: 180 }, // in seconds
  lyrics: { type: String, default: "" },
  genre: { type: String, required: true },
  audioUrl: { type: String, required: true }, // URL of the audio file (fallback)
  
  audio_source: {
    original_file_url: { type: String },
    stream_128kbps_url: { type: String },
    stream_320kbps_url: { type: String }
  },
  
  thumbnailUrl: { type: String }, // thumbnail/cover URL
  cover_image_url: { type: String }, // 1:1 image URL
  
  waveform_data: [{ type: Number }], // amplitude representation
  
  status: { type: String, enum: ['pending', 'approved', 'banned'], default: 'approved' },
  moderationState: { type: String, enum: ['pending', 'approved', 'banned'], default: 'approved' }, // matching seed.js
  
  stream_count: { type: Number, default: 0 },
  views: { type: Number, default: 0 }, // matches seed.js
  likes: { type: Number, default: 0 }, // matches seed.js
  
  deleted_at: { type: Date, default: null } // Soft delete
}, { timestamps: true });

// Sync status and moderationState
songSchema.pre('save', function() {
  if (this.isModified('status')) {
    this.moderationState = this.status;
  } else if (this.isModified('moderationState')) {
    this.status = this.moderationState;
  }
});

const Song = mongoose.model('Song', songSchema);
export default Song;
