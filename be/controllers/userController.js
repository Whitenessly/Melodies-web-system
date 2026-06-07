import User from '../models/User.js';
import Song from '../models/Song.js';

export async function toggleLikeSong(req, res) {
  try {
    const { songId } = req.body;
    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const index = req.user.likedSongs.indexOf(songId);
    let liked = false;

    if (index === -1) {
      // Like song
      req.user.likedSongs.push(songId);
      song.likes += 1;
      liked = true;
    } else {
      // Unlike song
      req.user.likedSongs.splice(index, 1);
      song.likes = Math.max(0, song.likes - 1);
    }

    await req.user.save();
    await song.save();

    return res.status(200).json({
      message: liked ? 'Song liked' : 'Song unliked',
      liked,
      likes: song.likes
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to like/unlike song', error: err.message });
  }
}

export async function toggleFollowArtist(req, res) {
  try {
    const { artistId } = req.body;
    if (!artistId) {
      return res.status(400).json({ message: 'Artist ID is required' });
    }

    const artist = await User.findById(artistId);
    if (!artist || artist.role !== 'artist') {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const index = req.user.following.indexOf(artistId);
    let followed = false;

    if (index === -1) {
      req.user.following.push(artistId);
      followed = true;
    } else {
      req.user.following.splice(index, 1);
    }

    await req.user.save();

    return res.status(200).json({
      message: followed ? 'Artist followed' : 'Artist unfollowed',
      followed
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to follow/unfollow artist', error: err.message });
  }
}

export async function getRecentlyPlayed(req, res) {
  try {
    const populatedUser = await User.findById(req.user._id)
      .populate('recentlyPlayed.songId')
      .exec();

    const history = populatedUser.recentlyPlayed
      .filter(item => item.songId != null) // filter out deleted songs
      .map(item => ({
        song: item.songId,
        playedAt: item.playedAt
      }));

    return res.status(200).json({ history });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve history', error: err.message });
  }
}

export async function getArtistStats(req, res) {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Artist only' });
    }

    const artistId = req.user._id;

    // Fetch songs owned by artist
    const songs = await Song.find({ artistId });

    // Total views/streams
    const totalStreams = songs.reduce((sum, song) => sum + song.views, 0);

    // Follower count (users who follow this artistId)
    const followersCount = await User.countDocuments({ following: artistId });

    // Compute fake channel storage usage: each song is ~8MB
    const storageUsed = (songs.length * 8.4 / 10).toFixed(1); // GB format out of 10GB limit

    return res.status(200).json({
      stats: {
        totalStreams,
        followersCount,
        storageUsed,
        totalTracks: songs.length
      },
      songs
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve statistics', error: err.message });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find({}).select('-password');
    return res.status(200).json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve users', error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    // Cleanup: If deleted user was an artist, delete their songs too
    if (user.role === 'artist') {
      const songs = await Song.find({ artistId: id });
      for (const song of songs) {
        // Remove from playlists/likes
        await Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } });
        await User.updateMany({ likedSongs: song._id }, { $pull: { likedSongs: song._id } });
        await Song.findByIdAndDelete(song._id);
      }
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}

export async function getArtistPublicProfile(req, res) {
  try {
    const { id } = req.params;
    const artist = await User.findById(id).select('-password');
    if (!artist || artist.role !== 'artist') {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const followersCount = await User.countDocuments({ following: id });
    const songs = await Song.find({ artistId: id, visibility: 'public', moderationState: 'approved' });

    // Check if the current user is following this artist
    const isFollowing = req.user ? req.user.following.includes(id) : false;

    return res.status(200).json({
      artist: {
        _id: artist._id,
        name: artist.name,
        email: artist.email,
        followersCount,
        isFollowing
      },
      songs
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve artist profile', error: err.message });
  }
}

export async function getPublicArtists(req, res) {
  try {
    const artists = await User.find({ role: 'artist' }).select('name email role');
    return res.status(200).json({ artists });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve artists', error: err.message });
  }
}
