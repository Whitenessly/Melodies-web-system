import Comment from '../models/Comment.js';

const PROFANITY_WORDS = [
  'cặc', 'lồn', 'địt', 'đéo', 'chịch', 'buồi', 'đm', 'vcl', 'clm', 
  'fuck', 'bitch', 'asshole', 'shit', 'pussy', 'dick'
];

function checkProfanity(content) {
  if (!content) return false;
  const lowercaseContent = content.toLowerCase();
  return PROFANITY_WORDS.some(word => lowercaseContent.includes(word));
}

export async function getCommentsForSong(req, res) {
  try {
    const { songId } = req.query;
    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    // regular users only see 'visible' comments, admins see everything
    const filter = { songId, deleted_at: null };
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'visible';
    }

    const comments = await Comment.find(filter)
      .populate('userId', 'name avatarUrl role')
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
}

export async function addComment(req, res) {
  try {
    const { songId, content, rating, timestamp_seconds } = req.body;
    if (!songId || !content) {
      return res.status(400).json({ message: 'Song ID and content are required' });
    }

    const hasProfanity = checkProfanity(content);
    const commentStatus = hasProfanity ? 'hidden' : 'visible';

    const comment = new Comment({
      songId,
      userId: req.user._id,
      content,
      rating: rating || 5,
      timestamp_seconds: timestamp_seconds || 0,
      status: commentStatus
    });

    await comment.save();
    
    // Populate user details for immediate client update
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name avatarUrl role');

    return res.status(201).json({
      comment: populatedComment,
      flagged: hasProfanity,
      message: hasProfanity ? 'Comment contains sensitive content and is pending moderation.' : 'Comment posted successfully.'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to post comment', error: err.message });
  }
}
