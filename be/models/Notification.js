import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['new_track', 'system', 'follow'], default: 'system' },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
