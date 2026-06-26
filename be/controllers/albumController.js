import Album from '../models/Album.js';

export async function getAllAlbums(req, res) {
  try {
    const { artistId } = req.query;
    const filter = { deleted_at: null };
    if (artistId) filter.artistId = artistId;

    const albums = await Album.find(filter).populate('artistId', 'name avatarUrl');
    return res.json(albums);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving albums', error: err.message });
  }
}

export async function getAlbumById(req, res) {
  try {
    const album = await Album.findOne({ _id: req.params.id, deleted_at: null })
      .populate('artistId', 'name avatarUrl')
      .populate({
        path: 'songs',
        match: { deleted_at: null, status: 'approved' }
      });
    if (!album) return res.status(404).json({ message: 'Album not found' });
    return res.json(album);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching album detail', error: err.message });
  }
}

export async function createAlbum(req, res) {
  try {
    const { title, genre, thumbnailUrl, songs } = req.body;
    if (!title || !genre) {
      return res.status(400).json({ message: 'Title and genre are required' });
    }

    const album = new Album({
      title,
      artist: req.user.name,
      artistId: req.user._id,
      genre,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500',
      songs: songs || []
    });

    await album.save();
    return res.status(201).json(album);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create album', error: err.message });
  }
}
