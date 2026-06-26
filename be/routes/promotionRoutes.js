import express from 'express';
import { getAllPromotions, validatePromotion } from '../controllers/promotionController.js';

const router = express.Router();

router.get('/', getAllPromotions);
router.post('/validate', validatePromotion);

export default router;
