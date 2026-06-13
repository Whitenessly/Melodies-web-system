import express from 'express';
import { toggleLikeSong, toggleFollowArtist, getRecentlyPlayed, getArtistStats, getAllUsers, deleteUser, getArtistPublicProfile, getPublicArtists, toggleLikePlaylist, getLikedSongs } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // All user actions require authentication

router.post('/likes', toggleLikeSong);
router.get('/likes/songs', getLikedSongs);
router.post('/likes/playlist', toggleLikePlaylist);
router.post('/follow', toggleFollowArtist);
router.get('/history', getRecentlyPlayed);
router.get('/artist/stats', getArtistStats);
router.get('/artists', getPublicArtists);
router.get('/artists/:id', getArtistPublicProfile);

// Admin-only management endpoints
router.get('/admin/users', authorize(['admin']), getAllUsers);
router.delete('/admin/users/:id', authorize(['admin']), deleteUser);

export default router;
