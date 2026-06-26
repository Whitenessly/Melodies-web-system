import User from '../models/User.js';
import Song from '../models/Song.js';

export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('following', 'name avatarUrl role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getArtists(req, res) {
  try {
    const artists = await User.find({ role: 'artist' }).select('name avatarUrl followersCount bio');
    return res.json(artists);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getLikedSongs(req, res) {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'likedSongs',
      match: { deleted_at: null, status: 'approved' },
      populate: { path: 'artistId', select: 'name' }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.likedSongs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function followUser(req, res) {
  try {
    const userToFollowId = req.params.id;
    if (userToFollowId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const me = await User.findById(req.user._id);
    if (!me.following.includes(userToFollowId)) {
      me.following.push(userToFollowId);
      await me.save();

      // Increment target user's followers count
      await User.findByIdAndUpdate(userToFollowId, { $inc: { followersCount: 1 } });
    }

    return res.json({ success: true, following: me.following });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function unfollowUser(req, res) {
  try {
    const userToUnfollowId = req.params.id;
    const me = await User.findById(req.user._id);
    
    if (me.following.includes(userToUnfollowId)) {
      me.following = me.following.filter(id => id.toString() !== userToUnfollowId);
      await me.save();

      // Decrement target user's followers count
      await User.findByIdAndUpdate(userToUnfollowId, { $inc: { followersCount: -1 } });
    }

    return res.json({ success: true, following: me.following });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
