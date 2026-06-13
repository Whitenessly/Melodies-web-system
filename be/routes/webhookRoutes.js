import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Webhook endpoint for Stripe
// Note: This must receive raw body, not JSON parsed
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
