import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';
import { saveBase64File } from '../utils/file.js';

export async function getAllSongs(req, res) {
  try {
    const { search, genre, artist } = req.query;
    let query = {};
    
    // Default visibility is public, unless fetching own tracks
    if (req.user) {
      if (req.user.role === 'admin') {
        // Admins can see everything
      } else {
        // Listeners & Artists can see public tracks, or artists can see their own private tracks
        query = {
          $or: [
            { visibility: 'public' },
            { artistId: req.user._id }
          ]
        };
      }
    } else {
      query = { visibility: 'public' };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: regex },
          { artist: regex }
        ]
      });
    }

    if (genre) {
      query.genre = new RegExp(`^${genre}$`, 'i');
    }

    if (artist) {
      query.artist = new RegExp(artist, 'i');
    }

    const songs = await Song.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ songs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve songs', error: err.message });
  }
}

export async function getTopSongs(req, res) {
  try {
    // Top charts sorted by views descending
    const songs = await Song.find({ visibility: 'public' })
      .sort({ views: -1 })
      .limit(10);
    return res.status(200).json({ songs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve charts', error: err.message });
  }
}

export async function createSong(req, res) {
  try {
    const { title, genre, lyrics, visibility, audio, image } = req.body;
    
    if (!title || !genre || !audio || !image) {
      return res.status(400).json({ message: 'Missing required song metadata or media' });
    }

    // Save media files
    const audioUrl = saveBase64File(audio, 'songs', 'mp3');
    const thumbnailUrl = saveBase64File(image, 'images', 'png');

    if (!audioUrl || !thumbnailUrl) {
      return res.status(500).json({ message: 'Failed to save media files on server' });
    }

    const song = new Song({
      title,
      artist: req.user.name,
      artistId: req.user._id,
      genre,
      audioUrl,
      thumbnailUrl,
      lyrics: lyrics || '',
      visibility: visibility || 'public'
    });

    await song.save();

    return res.status(201).json({
      message: 'Song uploaded successfully',
      song
    });
  } catch (err) {
    return res.status(500).json({ message: 'Song upload failed', error: err.message });
  }
}

export async function deleteSong(req, res) {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Authorize: Admin or original artist creator
    if (req.user.role !== 'admin' && song.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this song' });
    }

    await Song.findByIdAndDelete(id);

    // Business rule: Khi một bài hát bị xóa, gỡ bài hát đó ra khỏi các danh sách phát (playlist) hiện có
    await Playlist.updateMany(
      { songs: id },
      { $pull: { songs: id } }
    );

    // Also pull from users' liked songs and recently played lists
    await User.updateMany(
      { likedSongs: id },
      { $pull: { likedSongs: id } }
    );
    await User.updateMany(
      { 'recentlyPlayed.songId': id },
      { $pull: { recentlyPlayed: { songId: id } } }
    );

    return res.status(200).json({ message: 'Song deleted successfully and removed from all playlists' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete song', error: err.message });
  }
}

export async function incrementPlayCount(req, res) {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    song.views += 1;
    await song.save();

    // If user is logged in, log playback history
    if (req.user) {
      // Add to recentlyPlayed (max 20 items to prevent bloat)
      req.user.recentlyPlayed.unshift({ songId: song._id, playedAt: new Date() });
      if (req.user.recentlyPlayed.length > 20) {
        req.user.recentlyPlayed.pop();
      }
      await req.user.save();
    }

    return res.status(200).json({ message: 'Playback tracked successfully', views: song.views });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to track playback', error: err.message });
  }
}
