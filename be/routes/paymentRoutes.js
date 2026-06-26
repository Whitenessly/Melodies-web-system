import express from 'express';
import { createPayment, verifyPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/create', createPayment);
router.post('/verify', verifyPayment);

export default router;
