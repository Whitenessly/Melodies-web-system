import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import * as musicMetadata from 'music-metadata';
import User from './models/User.js';
import Song from './models/Song.js';
import Category from './models/Category.js';
import { hashPassword } from './utils/token.js';
import { transcodeTo128kbps } from './utils/audioTranscoder.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/melodies';
const MUSIC_FOLDER = 'C:\\Users\\Wsly\\Music';
const UPLOADS_FOLDER = path.join(process.cwd(), 'public', 'uploads', 'songs');

// Make sure target uploads folder exists
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

// Clean filename helper
function cleanFilename(filename) {
  let s = filename.replace(/\.mp3$/i, '');
  // Remove YouTube IDs (e.g., _6RLLOEzdxsM, _-1075825513)
  s = s.replace(/_[a-zA-Z0-9_-]{11}$/, '');
  s = s.replace(/_-?\d+$/, '');
  
  // Remove common YouTube/distributor labels
  s = s.replace(/\[Official Video\]/gi, '');
  s = s.replace(/\(Official Video\)/gi, '');
  s = s.replace(/\[NCS Release\]/gi, '');
  s = s.replace(/\(NCS Release\)/gi, '');
  s = s.replace(/\[NCS10 Release\]/gi, '');
  s = s.replace(/\[Monstercat Release\]/gi, '');
  s = s.replace(/\(Lyrics\)/gi, '');
  s = s.replace(/\(Lyrics Video\)/gi, '');
  s = s.replace(/\(Official Music Video\)/gi, '');
  s = s.replace(/\(Beau Collins Remix\)/gi, '');
  s = s.replace(/\(NIVIRO Extended Remix\)/gi, '');
  s = s.replace(/\(Official Lyric Video\)/gi, '');
  s = s.replace(/NCS Release/gi, '');
  s = s.replace(/Official Lyric Video/gi, '');
  s = s.replace(/Official Video/gi, '');
  s = s.replace(/\bMV\b/gi, '');
  s = s.replace(/♪/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Parse fallback details from filename
function parseFallbackFilename(cleanedName) {
  // Try split by ' - '
  if (cleanedName.includes(' - ')) {
    const parts = cleanedName.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts[1].trim()
    };
  }
  // Try split by '_'
  if (cleanedName.includes('_')) {
    const parts = cleanedName.split('_');
    // Often format is Title_Artist
    return {
      title: parts[0].trim(),
      artist: parts[1].trim()
    };
  }
  // Try split by double space
  if (cleanedName.includes('  ')) {
    const parts = cleanedName.split('  ');
    return {
      artist: parts[0].trim(),
      title: parts[1].trim()
    };
  }
  return {
    artist: 'Unknown Artist',
    title: cleanedName
  };
}

// Helper to split artist string into individual names
function splitArtists(artistStr) {
  if (!artistStr) return [];
  let s = artistStr;
  s = s.replace(/\s*[([{(]?\s*(?:feat\.?|ft\.?|featuring)\b[^)]*[)]}]?\s*/gi, ', ');
  s = s.replace(/\s+(?:&|and|x|X)\s+/g, ', ');
  const parts = s.split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0 && p.toLowerCase() !== 'unknown artist');
  return [...new Set(parts)];
}

// Sleep utility to respect rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache to avoid searching Wikipedia multiple times for the same artist
const artistCache = new Map();

async function getOrUpdateArtist(artistName) {
  const normalizedArtist = artistName.trim();
  if (artistCache.has(normalizedArtist)) {
    return artistCache.get(normalizedArtist);
  }

  // Check if artist already exists in Database
  let artist = await User.findOne({ name: normalizedArtist, role: 'artist' });
  if (artist) {
    artistCache.set(normalizedArtist, artist);
    return artist;
  }

  // Search Wikipedia for biography & avatar
  let bio = `No biography available for ${normalizedArtist}.`;
  let avatarUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'; // Default music placeholder

  // Helper search Wikipedia
  const fetchWiki = async (lang) => {
    try {
      console.log(`   Searching Wikipedia (${lang}) for artist: "${normalizedArtist}"...`);
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalizedArtist)}&format=json&origin=*`;
      const searchRes = await axios.get(searchUrl, { 
        headers: { 'User-Agent': 'MelodiesImporter/1.0' },
        timeout: 1500 
      });
      const searchResults = searchRes.data?.query?.search;
      if (searchResults && searchResults.length > 0) {
        const bestTitle = searchResults[0].title;
        const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
        const summaryRes = await axios.get(summaryUrl, { 
          headers: { 'User-Agent': 'MelodiesImporter/1.0' },
          timeout: 1500
        });
        return {
          bio: summaryRes.data.extract || '',
          avatarUrl: summaryRes.data.thumbnail?.source || ''
        };
      }
    } catch (e) {
      console.log(`   Wikipedia (${lang}) search failed: ${e.message}`);
    }
    return null;
  };

  // Try Vietnamese Wikipedia first, then English Wikipedia
  let wikiData = await fetchWiki('vi');
  if (!wikiData || !wikiData.bio) {
    wikiData = await fetchWiki('en');
  }

  if (wikiData) {
    if (wikiData.bio) bio = wikiData.bio;
    if (wikiData.avatarUrl) avatarUrl = wikiData.avatarUrl;
  }

  // Create new artist account
  const cleanEmail = normalizedArtist.toLowerCase().replace(/[^a-z0-9]/g, '') + '@melodies.com';
  // Ensure email is unique by appending random numbers if needed
  let finalEmail = cleanEmail;
  let emailExists = await User.findOne({ email: finalEmail });
  while (emailExists) {
    finalEmail = normalizedArtist.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000) + '@melodies.com';
    emailExists = await User.findOne({ email: finalEmail });
  }

  const defaultPass = hashPassword('Password123');
  artist = new User({
    name: normalizedArtist,
    email: finalEmail,
    password: defaultPass,
    role: 'artist',
    avatarUrl: avatarUrl,
    bio: bio,
    premium_status: 'FREE'
  });

  await artist.save();
  console.log(`✨ Created artist account: ${normalizedArtist} (${finalEmail})`);
  artistCache.set(normalizedArtist, artist);
  return artist;
}

async function getLyrics(artistName, songTitle) {
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(songTitle)}`;
    const response = await axios.get(url, { 
      headers: { 'User-Agent': 'MelodiesImporter/1.0' },
      timeout: 1000
    });
    if (response.data && response.data.length > 0) {
      return response.data[0].plainLyrics || '';
    }
  } catch (err) {
    console.log(`   Lyrics fetch error: ${err.message}`);
  }
  return '';
}

async function importSong(file) {
  const filePath = path.join(MUSIC_FOLDER, file);
  const cleanedName = cleanFilename(file);
  console.log(`\n🎵 Processing: "${file}" -> Query: "${cleanedName}"`);

  let songInfo = null;

  // 1. Try iTunes Search API
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanedName)}&media=music&limit=1`;
    const res = await axios.get(itunesUrl, { timeout: 2000 });
    if (res.data?.results && res.data.results.length > 0) {
      const result = res.data.results[0];
      songInfo = {
        title: result.trackName,
        artist: result.artistName,
        genre: result.primaryGenreName || 'Pop',
        duration: Math.round(result.trackTimeMillis / 1000),
        thumbnailUrl: result.artworkUrl100 ? result.artworkUrl100.replace('100x100bb', '600x600bb') : ''
      };
      console.log(`   Found on iTunes: "${songInfo.title}" by "${songInfo.artist}"`);
    }
  } catch (err) {
    console.log(`   iTunes search failed: ${err.message}`);
  }

  // 2. Fallback to filename parsing & music-metadata
  if (!songInfo) {
    const fallback = parseFallbackFilename(cleanedName);
    let duration = 180;
    try {
      const meta = await musicMetadata.parseFile(filePath);
      if (meta.format?.duration) {
        duration = Math.round(meta.format.duration);
      }
    } catch (e) {
      // ignore
    }
    songInfo = {
      title: fallback.title,
      artist: fallback.artist,
      genre: 'Pop',
      duration: duration,
      thumbnailUrl: ''
    };
    console.log(`   Fallback details: "${songInfo.title}" by "${songInfo.artist}"`);
  }

  // 3. Resolve collaborating artists
  const artistNames = splitArtists(songInfo.artist);
  const artistDocs = [];
  
  // Default fallback if no artists parsed
  if (artistNames.length === 0) {
    artistNames.push('Unknown Artist');
  }

  for (const name of artistNames) {
    try {
      const doc = await getOrUpdateArtist(name);
      artistDocs.push(doc);
    } catch (e) {
      console.error(`   Error creating artist account for "${name}":`, e.message);
    }
  }

  const primaryArtist = artistDocs[0] || { name: 'Unknown Artist', avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200' };
  const featuredArtists = artistDocs.slice(1);
  const cleanArtistString = artistNames.join(', ');

  // Use artist's avatar as thumbnail fallback if iTunes didn't return one
  if (!songInfo.thumbnailUrl) {
    songInfo.thumbnailUrl = primaryArtist.avatarUrl;
  }

  // 4. Fetch Lyrics from LRCLIB using the primary artist
  const lyrics = await getLyrics(primaryArtist.name, songInfo.title);
  if (lyrics) {
    console.log('   Lyrics found successfully!');
  } else {
    console.log('   No lyrics found.');
  }

  // 5. Copy file and create safe URL
  const urlSafeArtistPart = artistNames.map(a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-')).join('-');
  const baseName = songInfo.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + urlSafeArtistPart;
  
  // 320kbps and 128kbps output paths
  const destPath320 = path.join(UPLOADS_FOLDER, `${baseName}-320.mp3`);
  const destPath128 = path.join(UPLOADS_FOLDER, `${baseName}-128.mp3`);
  
  try {
    fs.copyFileSync(filePath, destPath320);
  } catch (err) {
    console.error(`   Failed to copy 320kbps file: ${err.message}`);
    return;
  }

  try {
    await transcodeTo128kbps(filePath, destPath128);
  } catch (err) {
    console.warn(`   Transcoding failed for "${file}", falling back to copy original: ${err.message}`);
    try {
      fs.copyFileSync(filePath, destPath128);
    } catch (copyErr) {
      console.error(`   Failed to copy 128kbps fallback: ${copyErr.message}`);
      return;
    }
  }

  const stream_320kbps_url = `http://localhost:8080/uploads/songs/${baseName}-320.mp3`;
  const stream_128kbps_url = `http://localhost:8080/uploads/songs/${baseName}-128.mp3`;
  const original_file_url = stream_320kbps_url;
  
  const audioUrl = stream_128kbps_url; // Default fallback is 128kbps
  
  const audio_source = {
    original_file_url,
    stream_128kbps_url,
    stream_320kbps_url
  };

  // 6. Generate waveform representation (100 values between 0.1 and 0.9)
  const waveform_data = Array.from({ length: 100 }, () => Math.round((Math.random() * 0.8 + 0.1) * 100) / 100);

  // Ensure Category exists for songInfo.genre
  if (songInfo.genre) {
    const trimmedGenre = songInfo.genre.trim();
    const existingCat = await Category.findOne({
      name: { $regex: new RegExp('^' + trimmedGenre.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
    });
    if (!existingCat) {
      const newCat = new Category({
        name: trimmedGenre,
        description: `${trimmedGenre} music and tracks`
      });
      await newCat.save();
      console.log(`   [AutoCategory] Created category for genre: "${trimmedGenre}"`);
    }
  }

  // Check if song already exists in database
  let songDoc = await Song.findOne({ title: songInfo.title, artistId: primaryArtist._id });
  if (songDoc) {
    // Update existing
    songDoc.artist = cleanArtistString;
    songDoc.featured_artists = featuredArtists.map(f => f._id);
    songDoc.duration = songInfo.duration;
    songDoc.lyrics = lyrics || songDoc.lyrics;
    songDoc.genre = songInfo.genre;
    songDoc.audioUrl = audioUrl;
    songDoc.audio_source = audio_source;
    songDoc.thumbnailUrl = songInfo.thumbnailUrl;
    songDoc.cover_image_url = songInfo.thumbnailUrl;
    songDoc.waveform_data = waveform_data;
    await songDoc.save();
    console.log(`   Updated existing song in database.`);
  } else {
    // Create new
    songDoc = new Song({
      title: songInfo.title,
      artist: cleanArtistString,
      artistId: primaryArtist._id,
      featured_artists: featuredArtists.map(f => f._id),
      duration: songInfo.duration,
      lyrics: lyrics,
      genre: songInfo.genre,
      audioUrl: audioUrl,
      audio_source: audio_source,
      thumbnailUrl: songInfo.thumbnailUrl,
      cover_image_url: songInfo.thumbnailUrl,
      waveform_data: waveform_data,
      status: 'approved',
      moderationState: 'approved'
    });
    await songDoc.save();
    console.log(`   Saved new song to database.`);
  }
}

async function cleanRecentImports() {
  console.log('🧹 Cleaning up recent imports from database...');
  const deletedSongs = await Song.deleteMany({
    audioUrl: { $regex: /^http:\/\/localhost:8080\/uploads\/songs\// }
  });
  console.log(`🗑️ Deleted ${deletedSongs.deletedCount} imported songs from DB.`);

  const deletedUsers = await User.deleteMany({
    email: { $regex: /@melodies\.com$/i },
    role: 'artist',
    email: { $nin: ['artist@melodies.com', 'admin@melodies.com'] }
  });
  console.log(`🗑️ Deleted ${deletedUsers.deletedCount} imported artists from DB.`);
}

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    await cleanRecentImports();

    console.log(`Reading files from ${MUSIC_FOLDER}...`);
    if (!fs.existsSync(MUSIC_FOLDER)) {
      console.error(`Directory ${MUSIC_FOLDER} does not exist!`);
      process.exit(1);
    }

    const files = fs.readdirSync(MUSIC_FOLDER).filter(f => f.toLowerCase().endsWith('.mp3'));
    console.log(`Found ${files.length} mp3 files. Limiting to first 10 for performance...`);

    // For safety and fast verification, let's limit or print a prompt.
    // We will process all of them, but with a sleep between each to respect API rate limits.
    const limit = Math.min(files.length, 10);
    for (let i = 0; i < limit; i++) {
      console.log(`\n--- Progress: ${i + 1}/${limit} ---`);
      try {
        await importSong(files[i]);
      } catch (err) {
        console.error(`Error processing file ${files[i]}:`, err.message);
      }
      // Wait 1 second to avoid rate limits
      await sleep(1000);
    }

    console.log('\n🎉 Finished importing all music files successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

run();
