import Song from '../models/Song.js';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import { saveBase64File } from '../utils/file.js';
import crypto from 'crypto';
import { updateLikedGenres, updateArtistGenres } from '../utils/genreHelpers.js';
import { findClosestCorrection } from '../utils/stringSimilarity.js';
import fs from 'fs';
import path from 'path';
import { transcodeTo128kbps } from '../utils/audioTranscoder.js';

function filterSongForUser(song, user) {
  if (!song) return song;
  const songObj = typeof song.toObject === 'function' ? song.toObject() : song;
  const isPremium = user && user.premium_status === 'PREMIUM';
  if (!isPremium) {
    if (songObj.audio_source) {
      delete songObj.audio_source.original_file_url;
      delete songObj.audio_source.stream_320kbps_url;
    }
    if (song.audio_source && song.audio_source.stream_128kbps_url) {
      songObj.audioUrl = song.audio_source.stream_128kbps_url;
    }
  }
  return songObj;
}

function filterSongsForUser(songsOrSong, user) {
  if (!songsOrSong) return songsOrSong;
  if (Array.isArray(songsOrSong)) {
    return songsOrSong.map(song => filterSongForUser(song, user));
  }
  return filterSongForUser(songsOrSong, user);
}


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

function paginateAndSend(songsList, req, res) {
  const filteredList = filterSongsForUser(songsList, req.user);
  if (req.query.page) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const total = filteredList.length;
    const pages = Math.ceil(total / limit);
    const paginated = filteredList.slice(skip, skip + limit);
    return res.json({
      songs: paginated,
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  }
  return res.json(filteredList);
}

export async function getAllSongs(req, res) {
  try {
    const { q, genre, artistId, isApproved } = req.query;
    
    // Update search history if user is logged in and q is queried
    if (q && req.user) {
      const cleanQ = q.trim();
      if (cleanQ) {
        let history = req.user.searchHistory || [];
        // Remove duplicate (case-insensitive)
        history = history.filter(item => item.toLowerCase() !== cleanQ.toLowerCase());
        history.unshift(cleanQ);
        if (history.length > 5) {
          history = history.slice(0, 5);
        }
        req.user.searchHistory = history;
        await req.user.save();
      }
    }

    // If this is a specific query/search, follow the standard path
    if (q || genre || artistId || isApproved !== 'true') {
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
        songs = songs.filter(song => {
          const cleanTitle = removeVietnameseTones(song.title).toLowerCase();
          return cleanTitle.includes(cleanSearch);
        });

        // Find matching artists
        const allArtists = await User.find({ role: 'artist' }).select('name avatarUrl followersCount bio');
        const matchingArtists = allArtists.filter(artist => {
          const cleanName = removeVietnameseTones(artist.name).toLowerCase();
          return cleanName.includes(cleanSearch);
        });

        // Find matching public playlists
        const allPlaylists = await Playlist.find({ visibility: 'public', deleted_at: null }).populate('userId', 'name avatarUrl');
        const matchingPlaylists = allPlaylists.filter(playlist => {
          const cleanTitle = removeVietnameseTones(playlist.title).toLowerCase();
          return cleanTitle.includes(cleanSearch);
        });

        // Pagination helper for sub-resources (artists, playlists)
        const formatPaginatedObj = (items, pageQuery, limitQuery, defaultLimit = 5) => {
          const page = parseInt(pageQuery, 10) || 1;
          const limit = parseInt(limitQuery, 10) || defaultLimit;
          const total = items.length;
          const pages = Math.ceil(total / limit) || 1;
          const skip = (page - 1) * limit;
          const data = items.slice(skip, skip + limit);
          return {
            data,
            pagination: {
              total,
              page,
              pages,
              limit
            }
          };
        };

        const artistPageQuery = req.query.artistPage || req.query.page;
        const artistLimitQuery = req.query.artistLimit || 8;
        const playlistPageQuery = req.query.playlistPage || req.query.page;
        const playlistLimitQuery = req.query.playlistLimit || 5;

        if (songs.length === 0 && matchingArtists.length === 0 && matchingPlaylists.length === 0) {
          // Get all candidates
          const candidateArtists = await User.find({ role: 'artist' }).select('name');
          const candidateSongs = await Song.find({ status: 'approved', deleted_at: null }).select('title');
          const candidatePlaylists = await Playlist.find({ visibility: 'public', deleted_at: null }).select('title');
          const candidates = [
            ...candidateArtists.map(a => a.name),
            ...candidateSongs.map(s => s.title),
            ...candidatePlaylists.map(p => p.title)
          ];

          const closestMatch = findClosestCorrection(q, candidates);
          if (closestMatch) {
            const cleanMatched = removeVietnameseTones(closestMatch).toLowerCase();
            
            // Find matching songs for closestMatch
            let correctedSongs = await Song.find(query).populate('artistId', 'name avatarUrl');
            correctedSongs = correctedSongs.filter(song => {
              const cleanTitle = removeVietnameseTones(song.title).toLowerCase();
              return cleanTitle.includes(cleanMatched);
            });

            // Find matching artists for closestMatch
            const correctedArtists = allArtists.filter(artist => {
              const cleanName = removeVietnameseTones(artist.name).toLowerCase();
              return cleanName.includes(cleanMatched);
            });

            // Find matching playlists for closestMatch
            const correctedPlaylists = allPlaylists.filter(playlist => {
              const cleanTitle = removeVietnameseTones(playlist.title).toLowerCase();
              return cleanTitle.includes(cleanMatched);
            });

            const artistsObj = formatPaginatedObj(correctedArtists, artistPageQuery, artistLimitQuery, 8);
            const playlistsObj = formatPaginatedObj(correctedPlaylists, playlistPageQuery, playlistLimitQuery, 5);

            // Return results with suggestedQuery field
            if (req.query.page) {
              const page = parseInt(req.query.page, 10) || 1;
              const limit = parseInt(req.query.limit, 10) || 10;
              const skip = (page - 1) * limit;
              const total = correctedSongs.length;
              const pages = Math.ceil(total / limit) || 1;
              const paginated = correctedSongs.slice(skip, skip + limit);
              return res.json({
                songs: filterSongsForUser(paginated, req.user),
                artists: artistsObj,
                playlists: playlistsObj,
                suggestedQuery: closestMatch,
                pagination: {
                  total,
                  page,
                  pages,
                  limit
                }
              });
            }
            return res.json({
              songs: filterSongsForUser(correctedSongs, req.user),
              artists: artistsObj,
              playlists: playlistsObj,
              suggestedQuery: closestMatch
            });
          }

          const recommendations = await Song.find({ status: 'approved', deleted_at: null })
            .limit(5)
            .populate('artistId', 'name avatarUrl');
          return res.json({ songs: [], recommendations: filterSongsForUser(recommendations, req.user), wasFuzzy: true });
        }

        const artistsObj = formatPaginatedObj(matchingArtists, artistPageQuery, artistLimitQuery, 8);
        const playlistsObj = formatPaginatedObj(matchingPlaylists, playlistPageQuery, playlistLimitQuery, 5);

        // Return paginated songs + matching artists + matching playlists
        if (req.query.page) {
          const page = parseInt(req.query.page, 10) || 1;
          const limit = parseInt(req.query.limit, 10) || 10;
          const skip = (page - 1) * limit;
          const total = songs.length;
          const pages = Math.ceil(total / limit) || 1;
          const paginated = songs.slice(skip, skip + limit);
          return res.json({
            songs: filterSongsForUser(paginated, req.user),
            artists: artistsObj,
            playlists: playlistsObj,
            pagination: {
              total,
              page,
              pages,
              limit
            }
          });
        }
        return res.json({
          songs: filterSongsForUser(songs, req.user),
          artists: artistsObj,
          playlists: playlistsObj
        });
      }
      
      return paginateAndSend(songs, req, res);
    }

    // Personalized recommendations path (for general home page /songs?isApproved=true)
    // If user is logged in and has likedGenres/searchHistory, recommend personalized songs
    if (req.user && ((req.user.likedGenres && req.user.likedGenres.length > 0) || (req.user.searchHistory && req.user.searchHistory.length > 0))) {
      const likedGenres = req.user.likedGenres || [];
      const searchHistory = req.user.searchHistory || [];
      
      const orConditions = [];

      // 1. Songs belonging to any liked genre
      if (likedGenres.length > 0) {
        orConditions.push({
          genre: { $in: likedGenres.map(g => new RegExp('^' + g.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')) }
        });
      }

      // 2. Songs related to search history
      for (const qStr of searchHistory) {
        // Search artist
        const artistDoc = await User.findOne({
          name: new RegExp('^' + qStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'),
          role: 'artist'
        });
        if (artistDoc) {
          if (likedGenres.length > 0) {
            orConditions.push({
              artistId: artistDoc._id,
              genre: { $in: likedGenres.map(g => new RegExp('^' + g.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')) }
            });
          } else {
            orConditions.push({ artistId: artistDoc._id });
          }
        }

        // Search song
        const songDoc = await Song.findOne({
          title: new RegExp('^' + qStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'),
          status: 'approved',
          deleted_at: null
        });
        if (songDoc) {
          orConditions.push({
            genre: new RegExp('^' + songDoc.genre.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'),
            _id: { $ne: songDoc._id }
          });
        }
      }

      let recommendedSongs = [];
      if (orConditions.length > 0) {
        recommendedSongs = await Song.find({
          status: 'approved',
          deleted_at: null,
          $or: orConditions
        })
        .sort({ createdAt: -1 })
        .populate('artistId', 'name avatarUrl');
      }

      // Fallback to all approved songs if recommendations are empty or to fill space
      const allApproved = await Song.find({ status: 'approved', deleted_at: null })
        .sort({ createdAt: -1 })
        .populate('artistId', 'name avatarUrl');

      // Combine lists preserving uniqueness
      const songMap = new Map();
      recommendedSongs.forEach(s => songMap.set(s._id.toString(), s));
      allApproved.forEach(s => {
        if (!songMap.has(s._id.toString())) {
          songMap.set(s._id.toString(), s);
        }
      });

      const combinedSongs = Array.from(songMap.values());
      return paginateAndSend(combinedSongs, req, res);
    }

    // Default fallback path for unauthenticated users or users without history
    const songs = await Song.find({ status: 'approved', deleted_at: null })
      .sort({ createdAt: -1 })
      .populate('artistId', 'name avatarUrl');
    return paginateAndSend(songs, req, res);
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
    return res.json(filterSongsForUser(song, req.user));
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

    // Generate transcoded 128kbps version
    let audio128Url = audioUrl;
    try {
      const audioFilename = audioUrl.split('/').pop();
      const originalLocalPath = path.join(process.cwd(), 'public', 'uploads', 'audio', audioFilename);
      
      const ext = path.extname(audioFilename);
      const baseName = path.basename(audioFilename, ext);
      const audio128Filename = `${baseName}-128${ext}`;
      const local128Path = path.join(process.cwd(), 'public', 'uploads', 'audio', audio128Filename);
      
      await transcodeTo128kbps(originalLocalPath, local128Path);
      
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
      audio128Url = `${backendUrl}/uploads/audio/${audio128Filename}`;
    } catch (transcodeErr) {
      console.error('Transcoding failed on upload, using original file as fallback:', transcodeErr.message);
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

    // Transcoding Pipeline urls
    const audio_source = {
      original_file_url: audioUrl,
      stream_128kbps_url: audio128Url,
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
      audioUrl: audio128Url, // Use 128kbps as primary audioUrl fallback
      audio_source,
      thumbnailUrl,
      cover_image_url: thumbnailUrl,
      waveform_data,
      status: initialStatus,
      moderationState: initialStatus
    });

    await song.save();
    await updateArtistGenres(req.user._id);
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
      await updateLikedGenres(user._id);
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
    await updateLikedGenres(user._id);

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
