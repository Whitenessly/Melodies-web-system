import express from 'express';
import { getAllSongs, getTopSongs, createSong, deleteSong, incrementPlayCount, updateSong } from '../controllers/songController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get songs can be accessed optionally authenticated (to view own private tracks)
// We'll write a simple middleware for optional authentication
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}

router.get('/', optionalAuthenticate, getAllSongs);
router.get('/charts', getTopSongs);
router.post('/', authenticate, authorize(['artist', 'admin']), createSong);
router.put('/:id', authenticate, updateSong);
router.delete('/:id', authenticate, deleteSong);
router.post('/:id/play', optionalAuthenticate, incrementPlayCount);

export default router;
