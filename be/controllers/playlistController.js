import Playlist from '../models/Playlist.js';
import Song from '../models/Song.js';
import { saveBase64File } from '../utils/file.js';

export async function getUserPlaylists(req, res) {
  try {
    // Return playlists owned by user, or public playlists if requested
    const playlists = await Playlist.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ playlists });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve playlists', error: err.message });
  }
}

export async function getPlaylistById(req, res) {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findById(id).populate({
      path: 'songs',
      match: { isDeleted: { $ne: true } },
      populate: {
        path: 'albumId',
        model: 'Album'
      }
    });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Access control: Private playlists can only be viewed by owner
    if (playlist.visibility === 'private' && playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: Private playlist' });
    }

    return res.status(200).json({ playlist });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve playlist details', error: err.message });
  }
}

export async function createPlaylist(req, res) {
  try {
    const { title, description, visibility, image } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Playlist title is required' });
    }

    let thumbnailUrl = '';
    if (image) {
      thumbnailUrl = saveBase64File(image, 'playlists', 'png');
    }

    const playlist = new Playlist({
      title,
      description: description || '',
      userId: req.user._id,
      thumbnailUrl,
      visibility: visibility || 'private',
      songs: []
    });

    await playlist.save();

    return res.status(201).json({
      message: 'Playlist created successfully',
      playlist
    });
  } catch (err) {
    return res.status(500).json({ message: 'Playlist creation failed', error: err.message });
  }
}

export async function addSongToPlaylist(req, res) {
  try {
    const { id } = req.params; // Playlist ID
    const { songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this playlist' });
    }

    const song = await Song.findById(songId);
    if (!song || song.isDeleted === true) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Avoid duplicates
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Song already in playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    return res.status(200).json({
      message: 'Song added to playlist successfully',
      playlist
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add song to playlist', error: err.message });
  }
}

export async function removeSongFromPlaylist(req, res) {
  try {
    const { id } = req.params; // Playlist ID
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this playlist' });
    }

    playlist.songs = playlist.songs.filter(id => id.toString() !== songId.toString());
    await playlist.save();

    return res.status(200).json({
      message: 'Song removed from playlist successfully',
      playlist
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove song from playlist', error: err.message });
  }
}

export async function deletePlaylist(req, res) {
  try {
    const { id } = req.params;
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this playlist' });
    }

    await Playlist.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete playlist', error: err.message });
  }
}

export async function updatePlaylist(req, res) {
  try {
    const { id } = req.params;
    const { title, description, visibility, image } = req.body;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this playlist' });
    }

    if (title !== undefined) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (visibility !== undefined) playlist.visibility = visibility;
    
    if (image) {
      playlist.thumbnailUrl = saveBase64File(image, 'playlists', 'png');
    }

    await playlist.save();

    return res.status(200).json({
      message: 'Playlist updated successfully',
      playlist
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update playlist', error: err.message });
  }
}
