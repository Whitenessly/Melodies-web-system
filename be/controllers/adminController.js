import User from '../models/User.js';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import Notification from '../models/Notification.js';

export async function getSystemStats(req, res) {
  try {
    const totalUsers = await User.countDocuments({});
    const totalSongs = await Song.countDocuments({ isDeleted: { $ne: true } });
    const totalAlbums = await Album.countDocuments({});

    const songs = await Song.find({ isDeleted: { $ne: true } });
    const totalStreams = songs.reduce((sum, s) => sum + (s.views || 0), 0);

    // Mock logs / events
    const securityLogs = [
      { id: 1, title: 'SQL Injection attempt blocked', ip: '192.168.1.112', time: '2 mins ago', severity: 'high' },
      { id: 2, title: 'Admin login detected', ip: '203.113.10.5', time: '15 mins ago', severity: 'info' },
      { id: 3, title: 'SSL Certificate renewed', ip: 'System', time: '1 hour ago', severity: 'success' },
      { id: 4, title: 'Database backup completed', ip: 'Cloud DB', time: '3 hours ago', severity: 'success' }
    ];

    return res.status(200).json({
      stats: {
        totalUsers,
        totalSongs,
        totalAlbums,
        totalStreams,
        cpuLoad: 24.8,
        latency: 14
      },
      securityLogs
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve system stats', error: err.message });
  }
}

export async function getPendingSongs(req, res) {
  try {
    const songs = await Song.find({ moderationState: 'pending', isDeleted: { $ne: true } })
      .populate('artistId', 'name email');
    return res.status(200).json({ songs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve moderation queue', error: err.message });
  }
}

export async function approveSong(req, res) {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song || song.isDeleted === true) {
      return res.status(404).json({ message: 'Song not found' });
    }
    song.moderationState = 'approved';
    await song.save();

    // Notify followers if song visibility is public
    if (song.visibility === 'public') {
      try {
        const followers = await User.find({ following: song.artistId });
        for (const follower of followers) {
          const notification = new Notification({
            userId: follower._id,
            senderId: song.artistId,
            title: 'Bài hát mới',
            message: `${song.artist} vừa phát hành bài hát mới: "${song.title}"`,
            type: 'new_track',
            link: `/player?songId=${song._id}`
          });
          await notification.save();
        }
      } catch (err) {
        console.error('Failed to send notifications on song approval:', err);
      }
    }

    return res.status(200).json({ message: 'Song approved successfully', song });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve song', error: err.message });
  }
}

export async function blockSong(req, res) {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song || song.isDeleted === true) {
      return res.status(404).json({ message: 'Song not found' });
    }
    song.moderationState = 'blocked';
    await song.save();
    return res.status(200).json({ message: 'Song blocked successfully', song });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to block song', error: err.message });
  }
}

export async function getPaginatedSongs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    let query = { isDeleted: { $ne: true } };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { artist: regex }
      ];
    }

    const totalSongs = await Song.countDocuments(query);
    const totalPages = Math.ceil(totalSongs / limit);
    const skip = (page - 1) * limit;

    const songs = await Song.find(query)
      .populate('artistId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      songs,
      totalSongs,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve paginated songs', error: err.message });
  }
}
