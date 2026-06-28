import User from '../models/User.js';
import Song from '../models/Song.js';

export async function updateLikedGenres(userId) {
  try {
    const user = await User.findById(userId).populate({
      path: 'likedSongs',
      match: { deleted_at: null, status: 'approved' }
    });
    
    if (!user) return;

    // Count frequencies of genres
    const genreCounts = {};
    for (const song of user.likedSongs) {
      if (song && song.genre) {
        const normalized = song.genre.trim();
        genreCounts[normalized] = (genreCounts[normalized] || 0) + 1;
      }
    }

    // Sort by frequency descending
    const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    
    user.likedGenres = sortedGenres;
    await user.save();
    console.log(`📊 Updated likedGenres for user "${user.name}":`, sortedGenres);
  } catch (error) {
    console.error('Error updating liked genres:', error.message);
  }
}

export async function updateArtistGenres(artistId) {
  try {
    const artist = await User.findById(artistId);
    if (!artist || artist.role !== 'artist') return;

    // Find all approved, non-deleted songs created by this artist or where they are featured
    const songs = await Song.find({
      $or: [
        { artistId: artistId },
        { featured_artists: artistId }
      ],
      status: 'approved',
      deleted_at: null
    });

    // Count frequencies
    const genreCounts = {};
    for (const song of songs) {
      if (song && song.genre) {
        const normalized = song.genre.trim();
        genreCounts[normalized] = (genreCounts[normalized] || 0) + 1;
      }
    }

    // Sort by frequency descending
    const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

    artist.artistGenres = sortedGenres;
    await artist.save();
    console.log(`📊 Updated artistGenres for artist "${artist.name}":`, sortedGenres);
  } catch (error) {
    console.error('Error updating artist genres:', error.message);
  }
}
