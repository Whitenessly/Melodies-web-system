import express from 'express';
import { getPromotions, createPromotion } from '../controllers/promotionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPromotions);
router.post('/', authenticate, authorize(['artist', 'admin']), createPromotion);

export default router;
