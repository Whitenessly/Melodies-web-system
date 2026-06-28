import express from 'express';
import { 
  getAllSongs, 
  getSongById, 
  createSong, 
  incrementStreamCount, 
  likeSong, 
  unlikeSong, 
  downloadSongDRM 
} from '../controllers/songController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuthenticate, getAllSongs);
router.get('/:id', getSongById);

// Authenticated routes
router.post('/', authenticate, createSong);
router.post('/:id/stream', authenticate, incrementStreamCount);
router.post('/:id/like', authenticate, likeSong);
router.post('/:id/unlike', authenticate, unlikeSong);
router.get('/:id/download-drm', authenticate, downloadSongDRM);

export default router;
