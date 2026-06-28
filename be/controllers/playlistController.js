import Playlist from '../models/Playlist.js';
import { saveBase64File } from '../utils/file.js';

export async function getAllPlaylists(req, res) {
  try {
    const playlists = await Playlist.find({ visibility: 'public', deleted_at: null })
      .populate('userId', 'name avatarUrl');
    return res.json(playlists);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUserPlaylists(req, res) {
  try {
    const playlists = await Playlist.find({ userId: req.user._id, deleted_at: null });
    return res.json(playlists);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getPlaylistById(req, res) {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, deleted_at: null })
      .populate('userId', 'name avatarUrl')
      .populate({
        path: 'songs',
        match: { deleted_at: null, status: 'approved' },
        populate: { path: 'artistId', select: 'name' }
      });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    return res.json(playlist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createPlaylist(req, res) {
  try {
    const { title, description, visibility, thumbnailUrl } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    let finalThumbnail = thumbnailUrl;
    if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
      finalThumbnail = saveBase64File(thumbnailUrl, 'playlists', 'png');
    }

    const playlist = new Playlist({
      title,
      description: description || '',
      userId: req.user._id,
      visibility: visibility || 'public',
      thumbnailUrl: finalThumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      songs: []
    });

    await playlist.save();
    return res.status(201).json(playlist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function addSongToPlaylist(req, res) {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found or access denied' });

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      if (!playlist.thumbnailUrl || playlist.thumbnailUrl.includes('photo-1470225620780-dba8ba36b745')) {
        // Update thumbnail automatically to song cover if default
        const Song = (await import('../models/Song.js')).default;
        const songObj = await Song.findById(songId);
        if (songObj) {
          playlist.thumbnailUrl = songObj.thumbnailUrl;
        }
      }
      await playlist.save();
    }

    return res.json(playlist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function removeSongFromPlaylist(req, res) {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found or access denied' });

    playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
    await playlist.save();

    return res.json(playlist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updatePlaylist(req, res) {
  try {
    const { title, description, visibility, thumbnailUrl } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id, deleted_at: null });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found or access denied' });

    if (title) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (visibility) playlist.visibility = visibility;
    
    if (thumbnailUrl !== undefined) {
      let finalThumbnail = thumbnailUrl;
      if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
        finalThumbnail = saveBase64File(thumbnailUrl, 'playlists', 'png');
      }
      playlist.thumbnailUrl = finalThumbnail;
    }

    await playlist.save();
    return res.json(playlist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deletePlaylist(req, res) {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id, deleted_at: null });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found or access denied' });

    playlist.deleted_at = new Date();
    await playlist.save();
    return res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
