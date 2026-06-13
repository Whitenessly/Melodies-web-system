import express from 'express';
import {
  getSubscriptionPlans,
  getUserSubscription,
  createSubscription,
  confirmSubscriptionPayment,
  cancelSubscription,
  getPaymentHistory,
  createPaymentIntent
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.get('/subscription', authenticate, getUserSubscription);
router.post('/subscription', authenticate, createSubscription);
router.post('/subscription/confirm', authenticate, confirmSubscriptionPayment);
router.delete('/subscription', authenticate, cancelSubscription);
router.get('/history', authenticate, getPaymentHistory);
router.post('/intent', authenticate, createPaymentIntent);

export default router;
