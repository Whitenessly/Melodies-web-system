import express from 'express';
import { getUserById, getArtists, getLikedSongs, followUser, unfollowUser } from '../controllers/userController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/artists', optionalAuthenticate, getArtists);
router.get('/liked-songs', authenticate, getLikedSongs);
router.get('/:id', getUserById);
router.post('/:id/follow', authenticate, followUser);
router.post('/:id/unfollow', authenticate, unfollowUser);

export default router;
