import express from 'express';
import { getUserPlaylists, getPlaylistById, createPlaylist, addSongToPlaylist, removeSongFromPlaylist, deletePlaylist, updatePlaylist } from '../controllers/playlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // All playlist routes require authentication

router.get('/', getUserPlaylists);
router.get('/:id', getPlaylistById);
router.post('/', createPlaylist);
router.put('/:id', updatePlaylist);
router.post('/:id/songs', addSongToPlaylist);
router.delete('/:id/songs', removeSongFromPlaylist);
router.delete('/:id', deletePlaylist);

export default router;
