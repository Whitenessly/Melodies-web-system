import express from 'express';
import { getSystemStats, getPendingSongs, approveSong, blockSong, getPaginatedSongs } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize(['admin']));

router.get('/stats', getSystemStats);
router.get('/moderation', getPendingSongs);
router.get('/songs', getPaginatedSongs);
router.put('/moderation/:id/approve', approveSong);
router.put('/moderation/:id/block', blockSong);

export default router;
