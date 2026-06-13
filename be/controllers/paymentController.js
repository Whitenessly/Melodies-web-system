import Stripe from 'stripe';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get all available subscription plans
export async function getSubscriptionPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    return res.status(200).json({ plans });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve plans', error: err.message });
  }
}

// Get user's current subscription
export async function getUserSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    return res.status(200).json({ subscription });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve subscription', error: err.message });
  }
}

// Create a Stripe customer for user if not exist
export async function getOrCreateStripeCustomer(userId) {
  try {
    let user = await User.findById(userId);
    
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: userId.toString() }
    });

    user.stripeCustomerId = customer.id;
    await user.save();

    return customer.id;
  } catch (err) {
    throw new Error(`Failed to create Stripe customer: ${err.message}`);
  }
}

// Create subscription
export async function createSubscription(req, res) {
  try {
    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    const plan = await SubscriptionPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if user already has active subscription
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'pending'] }
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(req.user._id);

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    // Create subscription record
    const subscription = new Subscription({
      userId: req.user._id,
      planId,
      status: 'pending',
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      features: {
        adFree: planId !== 'free',
        offlineDownload: planId === 'pro' || planId === 'premium',
        highQuality: planId === 'premium',
        prioritySupport: planId === 'premium',
        artistTools: planId === 'premium'
      }
    });

    await subscription.save();

    return res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create subscription', error: err.message });
  }
}

// Confirm subscription payment
export async function confirmSubscriptionPayment(req, res) {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update subscription status
      const stripeInvoice = await stripe.invoices.retrieve(paymentIntent.invoice);
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeInvoice.subscription
      });

      if (subscription) {
        subscription.status = 'active';
        await subscription.save();

        // Create payment record
        const payment = new Payment({
          userId: req.user._id,
          subscriptionId: subscription._id,
          planId: subscription.planId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          stripePaymentIntentId: paymentIntentId,
          stripeInvoiceId: stripeInvoice.id,
          paymentMethod: {
            type: paymentIntent.payment_method_details?.card?.wallet?.type || 'card',
            last4: paymentIntent.payment_method_details?.card?.last4,
            brand: paymentIntent.payment_method_details?.card?.brand
          },
          receiptUrl: stripeInvoice.receipt_url
        });

        await payment.save();

        return res.status(200).json({
          message: 'Payment confirmed successfully',
          subscription,
          payment
        });
      }
    } else if (paymentIntent.status === 'requires_action') {
      return res.status(400).json({
        message: 'Payment requires additional action',
        clientSecret: paymentIntent.client_secret
      });
    } else {
      return res.status(400).json({ message: 'Payment failed' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
}

// Cancel subscription
export async function cancelSubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Cancel in Stripe
    const canceledSubscription = await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // Update subscription status
    subscription.status = 'canceled';
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription canceled successfully',
      subscription
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel subscription', error: err.message });
  }
}

// Get payment history
export async function getPaymentHistory(req, res) {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('subscriptionId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve payment history', error: err.message });
  }
}

// Create payment intent for one-time payment (donations, tips)
export async function createPaymentIntent(req, res) {
  try {
    const { amount, description, metadata } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description,
      metadata: { userId: req.user._id.toString(), ...metadata }
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
}
