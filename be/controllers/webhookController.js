import Stripe from 'stripe';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        {
          const stripeSubscription = event.data.object;
          const subscription = await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: stripeSubscription.id },
            {
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              status: stripeSubscription.status === 'active' ? 'active' : 'canceled',
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
            },
            { new: true }
          );
          console.log('✅ Subscription updated:', subscription?._id);
        }
        break;

      case 'customer.subscription.deleted':
        {
          const stripeSubscription = event.data.object;
          const subscription = await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: stripeSubscription.id },
            { status: 'canceled' }
          );
          console.log('✅ Subscription canceled:', subscription?._id);
        }
        break;

      case 'invoice.payment_succeeded':
        {
          const invoice = event.data.object;
          console.log('✅ Payment succeeded:', invoice.id);
          // Handle payment success logic here
        }
        break;

      case 'invoice.payment_failed':
        {
          const invoice = event.data.object;
          console.log('❌ Payment failed:', invoice.id);
          // Handle payment failure logic here
        }
        break;

      case 'charge.refunded':
        {
          const charge = event.data.object;
          await Payment.findOneAndUpdate(
            { stripePaymentIntentId: charge.payment_intent },
            { status: 'canceled' }
          );
          console.log('✅ Charge refunded:', charge.id);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
