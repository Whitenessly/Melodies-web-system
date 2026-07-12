import express from 'express';
import { createPayment, verifyPayment, getAvailableGateways, chargeCard, getMyTransactions, removeCard, updateCard } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/gateways', getAvailableGateways);

// Protected routes
router.use(authenticate);
router.post('/create', createPayment);
router.post('/verify', verifyPayment);
router.post('/charge-card', chargeCard);
router.get('/history', getMyTransactions);
router.post('/remove-card', removeCard);
router.post('/update-card', updateCard);

export default router;
