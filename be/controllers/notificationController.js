import Notification from '../models/Notification.js';

export async function getUserNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 });
    return res.status(200).json({ notifications });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve notifications', error: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notifications', error: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    return res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
}
