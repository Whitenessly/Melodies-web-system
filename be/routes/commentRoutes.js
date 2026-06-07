import express from 'express';
import { getCommentsBySong, addComment, deleteComment } from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/songs/:songId', getCommentsBySong);
router.post('/songs/:songId', authenticate, addComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
