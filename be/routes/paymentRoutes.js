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

// Log all payment requests
router.use((req, res, next) => {
  console.log('📍 PAYMENT ROUTE:', req.method, req.path);
  next();
});

// Public route
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.get('/subscription', authenticate, getUserSubscription);

// Wrap subscription post with error handling
router.post('/subscription', authenticate, (req, res, next) => {
  createSubscription(req, res).catch(next);
});

router.post('/subscription/confirm', authenticate, (req, res, next) => {
  confirmSubscriptionPayment(req, res).catch(next);
});

router.delete('/subscription', authenticate, (req, res, next) => {
  cancelSubscription(req, res).catch(next);
});

router.get('/history', authenticate, getPaymentHistory);

router.post('/intent', authenticate, (req, res, next) => {
  createPaymentIntent(req, res).catch(next);
});

export default router;
