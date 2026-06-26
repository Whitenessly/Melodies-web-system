import express from 'express';
import { 
  getAllPlaylists, 
  getUserPlaylists, 
  getPlaylistById, 
  createPlaylist, 
  addSongToPlaylist, 
  removeSongFromPlaylist 
} from '../controllers/playlistController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllPlaylists);
router.get('/my', authenticate, getUserPlaylists);
router.get('/:id', getPlaylistById);
router.post('/', authenticate, createPlaylist);
router.post('/:id/add', authenticate, addSongToPlaylist);
router.post('/:id/remove', authenticate, removeSongFromPlaylist);

export default router;
