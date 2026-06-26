import User from '../models/User.js';
import Song from '../models/Song.js';
import Comment from '../models/Comment.js';
import Ad from '../models/Ad.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Notification from '../models/Notification.js';

export async function getDashboardStats(req, res) {
  try {
    const totalUsers = await User.countDocuments({ deleted_at: null });
    const premiumUsers = await User.countDocuments({ premium_status: 'PREMIUM', deleted_at: null });
    const artistUsers = await User.countDocuments({ role: 'artist', deleted_at: null });
    
    // Calculate total streams
    const songs = await Song.find({ deleted_at: null });
    const totalStreams = songs.reduce((sum, song) => sum + (song.stream_count || 0), 0);
    
    // Simulate active users (live users)
    const activeUsersLive = Math.floor(Math.random() * 50) + 12;
    
    // Revenue simulation: 59,000 VND (~$2.5) per premium user
    const monthlyRevenue = premiumUsers * 59000;

    // Charts simulation data
    const chartData = [
      { date: 'Monday', streams: 120, revenue: 295000 },
      { date: 'Tuesday', streams: 180, revenue: 354000 },
      { date: 'Wednesday', streams: 250, revenue: 413000 },
      { date: 'Thursday', streams: 300, revenue: 472000 },
      { date: 'Friday', streams: 390, revenue: 590000 },
      { date: 'Saturday', streams: 450, revenue: 708000 },
      { date: 'Sunday', streams: 520, revenue: 826000 },
    ];

    return res.json({
      metrics: {
        totalUsers,
        premiumUsers,
        artistUsers,
        totalStreams,
        activeUsersLive,
        monthlyRevenue
      },
      chartData
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving stats', error: err.message });
  }
}

// Moderation
export async function getModerationQueue(req, res) {
  try {
    const songs = await Song.find({ status: 'pending', deleted_at: null })
      .populate('artistId', 'name email');
    return res.json(songs);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching moderation queue', error: err.message });
  }
}

export async function approveSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    song.status = 'approved';
    song.moderationState = 'approved';
    await song.save();

    // Notify artist
    const notification = new Notification({
      userId: song.artistId,
      title: 'Bài hát đã được phê duyệt',
      message: `Chúc mừng! Bài hát "${song.title}" đã được duyệt và chính thức xuất bản trên hệ thống.`,
      type: 'system'
    });
    await notification.save();

    return res.json({ message: 'Song approved successfully', song });
  } catch (err) {
    return res.status(500).json({ message: 'Error approving song', error: err.message });
  }
}

export async function banSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    song.status = 'banned';
    song.moderationState = 'banned';
    await song.save();

    // Notify artist
    const notification = new Notification({
      userId: song.artistId,
      title: 'Nội dung bị gỡ bỏ',
      message: `Cảnh báo: Bài hát "${song.title}" đã bị gỡ bỏ khỏi hệ thống do vi phạm bản quyền hoặc tiêu chuẩn cộng đồng.`,
      type: 'admin'
    });
    await notification.save();

    return res.json({ message: 'Song banned/removed successfully', song });
  } catch (err) {
    return res.status(500).json({ message: 'Error banning song', error: err.message });
  }
}

// Comments
export async function getCommentsQueue(req, res) {
  try {
    const comments = await Comment.find({ status: 'hidden', deleted_at: null })
      .populate('userId', 'name email')
      .populate('songId', 'title');
    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving comment moderation queue', error: err.message });
  }
}

export async function approveComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.status = 'visible';
    await comment.save();

    return res.json({ message: 'Comment approved successfully', comment });
  } catch (err) {
    return res.status(500).json({ message: 'Error approving comment', error: err.message });
  }
}

export async function deleteComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.deleted_at = new Date();
    await comment.save();

    return res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
}

// Advertising CRUD
export async function getAds(req, res) {
  try {
    const ads = await Ad.find();
    return res.json(ads);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching ads', error: err.message });
  }
}

export async function getRandomAd(req, res) {
  try {
    const activeAds = await Ad.find({ status: 'active' });
    if (activeAds.length === 0) {
      return res.status(404).json({ message: 'No active ads found' });
    }
    // Simple random selection
    const randomIndex = Math.floor(Math.random() * activeAds.length);
    const selectedAd = activeAds[randomIndex];

    // Log impression in background
    selectedAd.impressions = (selectedAd.impressions || 0) + 1;
    selectedAd.budgetSpent = (selectedAd.budgetSpent || 0) + 5; // e.g., 5 cents per impression
    if (selectedAd.budgetSpent >= selectedAd.budgetLimit) {
      selectedAd.status = 'ended';
    }
    await selectedAd.save();

    return res.json(selectedAd);
  } catch (err) {
    return res.status(500).json({ message: 'Error serving ad', error: err.message });
  }
}

export async function createAd(req, res) {
  try {
    const { title, type, clientName, budgetLimit, audioUrl, imageUrl, targetUrl, location } = req.body;
    if (!title || !type || !clientName || !budgetLimit) {
      return res.status(400).json({ message: 'Missing required ad campaign information' });
    }

    const ad = new Ad({
      title,
      type,
      clientName,
      budgetLimit,
      audioUrl: audioUrl || '',
      imageUrl: imageUrl || '',
      targetUrl: targetUrl || '',
      location: location || 'Global',
      status: 'active'
    });

    await ad.save();
    return res.status(201).json(ad);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create ad campaign', error: err.message });
  }
}

export async function updateAd(req, res) {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) return res.status(404).json({ message: 'Ad campaign not found' });
    return res.json(ad);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update campaign', error: err.message });
  }
}

export async function deleteAd(req, res) {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad campaign not found' });
    return res.json({ message: 'Ad campaign deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete campaign', error: err.message });
  }
}

export async function trackAdClick(req, res) {
  try {
    const ad = await Ad.findById(req.params.id);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      ad.budgetSpent = (ad.budgetSpent || 0) + 20; // 20 cents per click
      if (ad.budgetSpent >= ad.budgetLimit) {
        ad.status = 'ended';
      }
      await ad.save();
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Subscription plans Price Edit
export async function getPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find();
    return res.json(plans);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updatePlanPrice(req, res) {
  try {
    const { price } = req.body;
    if (price === undefined || price < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Subscription tier not found' });

    plan.price = price;
    await plan.save();

    return res.json({ message: 'Plan price updated successfully', plan });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating plan price', error: err.message });
  }
}

export async function updatePaymentConfig(req, res) {
  try {
    const { secretKey, merchantId, gateway } = req.body;
    if (!gateway) return res.status(400).json({ message: 'Gateway is required' });
    
    // In local development simulation, we log this and success
    console.log(`🔐 CONFIG UPDATE - Gateway: ${gateway}, MerchantID: ${merchantId}, SecretKey: [HIDDEN]`);
    return res.json({ message: `Successfully updated payment credentials configuration for ${gateway} Sandbox!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
