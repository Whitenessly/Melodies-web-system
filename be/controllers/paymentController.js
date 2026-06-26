import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Stripe from 'stripe';

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createPayment(req, res) {
  try {
    const { planId, gateway } = req.body;
    if (!planId || !gateway) {
      return res.status(400).json({ message: 'Plan ID and payment gateway are required' });
    }

    const plan = await SubscriptionPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create pending transaction record
    const transaction = new Transaction({
      user_id: req.user._id,
      order_id: orderId,
      amount: plan.price,
      payment_gateway: gateway,
      status: 'PENDING'
    });
    await transaction.save();

    // Check gateway
    if (gateway === 'stripe') {
      if (stripe && process.env.DEMO_MODE !== 'true') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: plan.currency,
              product_data: {
                name: `Melodies Premium - ${plan.name} Plan`,
                description: plan.description,
              },
              unit_amount: plan.price, // in cents
            },
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: `${req.headers.origin}/payment-confirm?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}&gateway=stripe`,
          cancel_url: `${req.headers.origin}/subscription-plans`,
          client_reference_id: req.user._id.toString(),
          metadata: { orderId }
        });
        return res.json({ payment_url: session.url, orderId });
      } else {
        // Stripe Demo Mode / Fallback
        const mockUrl = `/payment-confirm?orderId=${orderId}&gateway=stripe&status=SUCCESS`;
        return res.json({ payment_url: mockUrl, orderId });
      }
    } else if (gateway === 'momo' || gateway === 'vnpay') {
      // Vietnam local payment gateways (Momo / VNPay sandbox simulation)
      const mockUrl = `/payment-confirm?orderId=${orderId}&gateway=${gateway}&status=SUCCESS`;
      return res.json({ payment_url: mockUrl, orderId });
    } else {
      return res.status(400).json({ message: 'Unsupported payment gateway' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create payment session', error: err.message });
  }
}

// Simulated Webhook or direct verify API for demo mode
export async function verifyPayment(req, res) {
  try {
    const { orderId, gateway, status } = req.body;
    const transaction = await Transaction.findOne({ order_id: orderId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.json({ message: 'Transaction already processed', transaction });
    }

    if (status === 'SUCCESS') {
      transaction.status = 'SUCCESS';
      transaction.gateway_transaction_id = `gt_mock_${Date.now()}`;
      transaction.completed_at = new Date();
      await transaction.save();

      // Upgrade User to PREMIUM
      const user = await User.findById(transaction.user_id);
      if (user) {
        user.premium_status = 'PREMIUM';
        
        // 30 days from now
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.premium_expired_at = expiry;
        
        await user.save();
      }

      return res.json({ message: 'Payment verified successfully and Premium membership activated!', transaction });
    } else {
      transaction.status = 'FAILED';
      await transaction.save();
      return res.status(400).json({ message: 'Payment verification failed', transaction });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Verification error', error: err.message });
  }
}

// Actual stripe webhook endpoint
export async function stripeWebhook(req, res) {
  let event = req.body;
  
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle checkout session completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const userId = session.client_reference_id;

    const transaction = await Transaction.findOne({ order_id: orderId });
    if (transaction && transaction.status === 'PENDING') {
      transaction.status = 'SUCCESS';
      transaction.gateway_transaction_id = session.id;
      transaction.completed_at = new Date();
      await transaction.save();

      const user = await User.findById(userId);
      if (user) {
        user.premium_status = 'PREMIUM';
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.premium_expired_at = expiry;
        await user.save();
      }
    }
  }

  return res.json({ received: true });
}
