import express from 'express';
import { getCommentsForSong, addComment } from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Optional authentication to fetch comments (so admins can see hidden ones)
router.get('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, getCommentsForSong);

router.post('/', authenticate, addComment);

export default router;
