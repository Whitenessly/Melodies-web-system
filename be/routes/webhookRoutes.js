import express from 'express';
import { stripeWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Using raw express body parser or parsing as JSON depending on setup
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
