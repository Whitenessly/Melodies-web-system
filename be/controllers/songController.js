import Song from '../models/Song.js';
import User from '../models/User.js';
import { saveBase64File } from '../utils/file.js';
import crypto from 'crypto';

// Helper to remove Vietnamese tones for fuzzy search
function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, ""); // diacritics
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // hats
  return str.trim();
}

export async function getAllSongs(req, res) {
  try {
    const { q, genre, artistId, isApproved } = req.query;
    let query = { deleted_at: null };

    if (isApproved === 'true') {
      query.status = 'approved';
    }

    if (artistId) {
      query.artistId = artistId;
    }

    if (genre) {
      query.genre = new RegExp(genre, 'i');
    }

    let songs = await Song.find(query).populate('artistId', 'name avatarUrl');

    if (q) {
      const cleanSearch = removeVietnameseTones(q).toLowerCase();
      // Simple fuzzy search filter on results using Regex or diacritic-free matches
      songs = songs.filter(song => {
        const cleanTitle = removeVietnameseTones(song.title).toLowerCase();
        const cleanArtistName = removeVietnameseTones(song.artist).toLowerCase();
        return cleanTitle.includes(cleanSearch) || cleanArtistName.includes(cleanSearch);
      });
    }

    // Recommendation logic if search yielded nothing
    if (q && songs.length === 0) {
      const recommendations = await Song.find({ status: 'approved', deleted_at: null })
        .limit(5)
        .populate('artistId', 'name avatarUrl');
      return res.json({ songs: [], recommendations, wasFuzzy: true });
    }

    return res.json(songs);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch songs', error: err.message });
  }
}

export async function getSongById(req, res) {
  try {
    const song = await Song.findOne({ _id: req.params.id, deleted_at: null })
      .populate('artistId', 'name avatarUrl following followersCount');
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    return res.json(song);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving song', error: err.message });
  }
}

export async function createSong(req, res) {
  try {
    const { title, genre, lyrics, audioData, imageData, duration } = req.body;

    if (!title || !genre || !audioData) {
      return res.status(400).json({ message: 'Title, genre, and audio file are required' });
    }

    // Save audio file
    const audioUrl = saveBase64File(audioData, 'audio', 'mp3');
    if (!audioUrl) {
      return res.status(500).json({ message: 'Failed to process audio upload' });
    }

    // Save cover image
    let thumbnailUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500';
    if (imageData) {
      const savedImage = saveBase64File(imageData, 'images', 'png');
      if (savedImage) thumbnailUrl = savedImage;
    }

    // Generate simulated waveform data (e.g. 80 points)
    const waveform_data = [];
    for (let i = 0; i < 80; i++) {
      waveform_data.push(parseFloat((Math.random() * 0.8 + 0.2).toFixed(2)));
    }

    // Simulate Transcoding Pipeline urls
    const audio_source = {
      original_file_url: audioUrl,
      stream_128kbps_url: audioUrl, // In mock, both point to same or can append quality suffixes
      stream_320kbps_url: audioUrl
    };

    // Users who are artists or admins upload approved or pending songs
    const artist = await User.findById(req.user._id);
    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';

    const song = new Song({
      title,
      artist: artist ? artist.name : 'Unknown Artist',
      artistId: req.user._id,
      duration: duration || 180,
      lyrics: lyrics || '',
      genre,
      audioUrl,
      audio_source,
      thumbnailUrl,
      cover_image_url: thumbnailUrl,
      waveform_data,
      status: initialStatus,
      moderationState: initialStatus
    });

    await song.save();
    return res.status(201).json(song);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create song', error: err.message });
  }
}

export async function incrementStreamCount(req, res) {
  try {
    const { durationListened } = req.body;
    if (!durationListened || durationListened < 30) {
      return res.status(400).json({ message: 'Listening duration must be at least 30 seconds to count as a stream' });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    song.stream_count = (song.stream_count || 0) + 1;
    song.views = (song.views || 0) + 1;
    await song.save();

    // Add to user's recentlyPlayed
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Keep only top 20 items
        user.recentlyPlayed.unshift({ songId: song._id });
        if (user.recentlyPlayed.length > 20) {
          user.recentlyPlayed.pop();
        }
        await user.save();
      }
    }

    return res.json({ success: true, stream_count: song.stream_count });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to increment stream count', error: err.message });
  }
}

export async function likeSong(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const songId = req.params.id;
    if (!user.likedSongs.includes(songId)) {
      user.likedSongs.push(songId);
      await user.save();

      // Increment likes count on song
      await Song.findByIdAndUpdate(songId, { $inc: { likes: 1 } });
    }

    return res.json({ success: true, likedSongs: user.likedSongs });
  } catch (err) {
    return res.status(500).json({ message: 'Error liking song', error: err.message });
  }
}

export async function unlikeSong(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const songId = req.params.id;
    user.likedSongs = user.likedSongs.filter(id => id.toString() !== songId);
    await user.save();

    // Decrement likes count on song
    await Song.findByIdAndUpdate(songId, { $inc: { likes: -1 } });

    return res.json({ success: true, likedSongs: user.likedSongs });
  } catch (err) {
    return res.status(500).json({ message: 'Error unliking song', error: err.message });
  }
}

export async function downloadSongDRM(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    // Validate Premium status
    if (req.user.premium_status !== 'PREMIUM') {
      return res.status(403).json({ message: 'Premium membership is required to download DRM encrypted files' });
    }

    // Create encrypted buffer: Mock encryption by XORing song title with random bytes
    const metadata = JSON.stringify({
      songId: song._id,
      title: song.title,
      artist: song.artist,
      lyrics: song.lyrics,
      downloadedAt: new Date().toISOString(),
      watermark: 'MELODIES-DRM-SECURED'
    });

    const metadataBuffer = Buffer.from(metadata);
    const key = crypto.randomBytes(4); // 4-byte encryption key
    
    // Simple XOR cipher
    const encryptedData = Buffer.alloc(metadataBuffer.length);
    for (let i = 0; i < metadataBuffer.length; i++) {
      encryptedData[i] = metadataBuffer[i] ^ key[i % key.length];
    }

    // Construct custom binary DRM package: [4 bytes key] + [4 bytes length of metadata] + [encrypted metadata]
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(encryptedData.length, 0);

    const drmFileBuffer = Buffer.concat([key, lengthBuffer, encryptedData]);

    res.setHeader('Content-Disposition', `attachment; filename="${song.title.replace(/\s+/g, '_')}.melodrm"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(drmFileBuffer);
  } catch (err) {
    return res.status(500).json({ message: 'DRM compilation failed', error: err.message });
  }
}
