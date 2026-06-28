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
    let likedGenres = [];
    let excludeIds = [];

    if (req.user) {
      likedGenres = req.user.likedGenres || [];
      excludeIds.push(req.user._id);
      if (req.user.following && req.user.following.length > 0) {
        excludeIds = excludeIds.concat(req.user.following);
      }
    }

    // Get all candidate artists
    const otherArtists = await User.find({
      role: 'artist',
      _id: { $nin: excludeIds }
    }).select('name avatarUrl followersCount bio');

    let recommendedArtists = [];

    if (likedGenres.length > 0) {
      for (const artist of otherArtists) {
        const count = await Song.countDocuments({
          artistId: artist._id,
          genre: { $in: likedGenres.map(g => new RegExp('^' + g.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')) },
          status: 'approved',
          deleted_at: null
        });
        if (count > 0) {
          recommendedArtists.push({
            _id: artist._id,
            name: artist.name,
            avatarUrl: artist.avatarUrl,
            followersCount: artist.followersCount,
            bio: artist.bio,
            matchSongCount: count
          });
        }
      }
      
      // Sort by matching songs count descending
      recommendedArtists.sort((a, b) => b.matchSongCount - a.matchSongCount);
    }

    // Append fallback artists if list is empty or short to fill recommendations
    const recommendedMap = new Map();
    recommendedArtists.forEach(a => recommendedMap.set(a._id.toString(), a));
    
    otherArtists.forEach(artist => {
      if (!recommendedMap.has(artist._id.toString())) {
        recommendedMap.set(artist._id.toString(), {
          _id: artist._id,
          name: artist.name,
          avatarUrl: artist.avatarUrl,
          followersCount: artist.followersCount,
          bio: artist.bio,
          matchSongCount: 0
        });
      }
    });

    const combinedArtists = Array.from(recommendedMap.values());
    return res.json(combinedArtists);
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
