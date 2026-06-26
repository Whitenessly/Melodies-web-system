import express from 'express';
import { getAllAlbums, getAlbumById, createAlbum } from '../controllers/albumController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllAlbums);
router.get('/:id', getAlbumById);
router.post('/', authenticate, createAlbum);

export default router;
