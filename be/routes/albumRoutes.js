import express from 'express';
import { getAllAlbums, getAlbumById, createAlbum, deleteAlbum } from '../controllers/albumController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllAlbums);
router.get('/:id', getAlbumById);
router.post('/', authenticate, authorize(['artist', 'admin']), createAlbum);
router.delete('/:id', authenticate, deleteAlbum);

export default router;
