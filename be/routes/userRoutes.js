import express from 'express';
import { toggleLikeSong, toggleFollowArtist, getRecentlyPlayed, getArtistStats, getAllUsers, deleteUser } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // All user actions require authentication

router.post('/likes', toggleLikeSong);
router.post('/follow', toggleFollowArtist);
router.get('/history', getRecentlyPlayed);
router.get('/artist/stats', getArtistStats);

// Admin-only management endpoints
router.get('/admin/users', authorize(['admin']), getAllUsers);
router.delete('/admin/users/:id', authorize(['admin']), deleteUser);

export default router;
