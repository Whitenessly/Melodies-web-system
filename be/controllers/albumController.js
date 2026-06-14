import Album from '../models/Album.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
import User from '../models/User.js';
import { saveBase64File } from '../utils/file.js';

export async function getAllAlbums(req, res) {
  try {
    const { search, page, limit } = req.query;
    
    let query = {
      visibility: 'public'
    };
    
    if (search) {
      const regex = new RegExp(search, 'i');
      
      // Find all matching artists (users with role 'artist' whose name matches search)
      const matchingArtists = await User.find({
        role: 'artist',
        name: regex
      });
      const artistIds = matchingArtists.map(a => a._id);
      
      query.$or = [
        { title: regex },
        { userId: { $in: artistIds } }
      ];
    }

    let playlistsQuery = Playlist.find(query)
      .populate('userId', 'name')
      .populate({
        path: 'songs',
        match: { isDeleted: { $ne: true } }
      })
      .sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skipNum = (pageNum - 1) * limitNum;
      
      const totalAlbums = await Playlist.countDocuments(query);
      const playlists = await playlistsQuery.skip(skipNum).limit(limitNum);

      const albums = playlists.map(p => ({
        _id: p._id,
        title: p.title,
        thumbnailUrl: p.thumbnailUrl,
        songs: p.songs,
        artist: p.userId ? p.userId.name : 'Unknown',
        genre: p.songs && p.songs.length > 0 ? p.songs[0].genre : 'Playlist'
      }));

      return res.status(200).json({ 
        albums,
        pagination: {
          total: totalAlbums,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalAlbums / limitNum)
        }
      });
    }

    const playlists = await playlistsQuery;
    const albums = playlists.map(p => ({
      _id: p._id,
      title: p.title,
      thumbnailUrl: p.thumbnailUrl,
      songs: p.songs,
      artist: p.userId ? p.userId.name : 'Unknown',
      genre: p.songs && p.songs.length > 0 ? p.songs[0].genre : 'Playlist'
    }));

    return res.status(200).json({ albums });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve playlists as albums', error: err.message });
  }
}

export async function getAlbumById(req, res) {
  try {
    const { id } = req.params;
    const album = await Album.findById(id).populate({
      path: 'songs',
      match: { isDeleted: { $ne: true } }
    });
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }
    return res.status(200).json({ album });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve album details', error: err.message });
  }
}

export async function createAlbum(req, res) {
  try {
    const { title, genre, image, songs } = req.body;
    
    if (!title || !genre || !image) {
      return res.status(400).json({ message: 'Missing required album metadata' });
    }

    const thumbnailUrl = saveBase64File(image, 'albums', 'png');
    if (!thumbnailUrl) {
      return res.status(500).json({ message: 'Failed to save album cover' });
    }

    // Verify songs are owned by artist
    let songIds = [];
    if (songs && Array.isArray(songs)) {
      const dbSongs = await Song.find({ _id: { $in: songs }, artistId: req.user._id, isDeleted: { $ne: true } });
      songIds = dbSongs.map(s => s._id);
    }

    const album = new Album({
      title,
      artist: req.user.name,
      artistId: req.user._id,
      genre,
      thumbnailUrl,
      songs: songIds
    });

    await album.save();

    // Link songs to this albumId
    if (songIds.length > 0) {
      await Song.updateMany(
        { _id: { $in: songIds } },
        { albumId: album._id }
      );
    }

    return res.status(201).json({
      message: 'Album created successfully',
      album
    });
  } catch (err) {
    return res.status(500).json({ message: 'Album creation failed', error: err.message });
  }
}

export async function deleteAlbum(req, res) {
  try {
    const { id } = req.params;
    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Authorize: Admin or original artist creator
    if (req.user.role !== 'admin' && album.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this album' });
    }

    await Album.findByIdAndDelete(id);

    // Unlink songs from this album
    await Song.updateMany(
      { albumId: id },
      { $unset: { albumId: "" } }
    );

    return res.status(200).json({ message: 'Album deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete album', error: err.message });
  }
}
