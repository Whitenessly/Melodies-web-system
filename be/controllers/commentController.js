import Comment from '../models/Comment.js';
import Song from '../models/Song.js';

export async function getCommentsBySong(req, res) {
  try {
    const { songId } = req.params;
    const comments = await Comment.find({ songId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    return res.status(200).json({ comments });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve comments', error: err.message });
  }
}

export async function addComment(req, res) {
  try {
    const { songId } = req.params;
    const { content, rating } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const song = await Song.findById(songId);
    if (!song || song.isDeleted === true) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const comment = new Comment({
      songId,
      userId: req.user._id,
      content,
      rating: rating || 5
    });

    await comment.save();

    // Populate user info for returning response
    const populated = await comment.populate('userId', 'name email role');

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: populated
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
}

export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const song = await Song.findById(comment.songId);

    // Authorization: commenter, song owner (artist), or admin
    const isCommenter = comment.userId.toString() === req.user._id.toString();
    const isSongOwner = song && song.artistId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommenter && !isSongOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You cannot delete this comment' });
    }

    await Comment.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
}
