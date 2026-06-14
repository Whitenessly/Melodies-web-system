import Stripe from 'stripe';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_MODE = process.env.DEMO_MODE === 'true';
let stripe = null;

if (!DEMO_MODE && process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  } catch (err) {
    console.error('❌ Stripe initialization error:', err.message);
    console.log('⚠️ Falling back to DEMO MODE');
  }
}

console.log('🔧 Payment Controller: DEMO_MODE =', DEMO_MODE, ', Stripe =', stripe ? 'initialized' : 'null');

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
    // Get the most recent subscription (active or pending)
    const subscription = await Subscription.findOne({ 
      userId: req.user._id,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });
    
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
    console.log('=== CREATE SUBSCRIPTION REQUEST ===');
    console.log('planId:', planId);
    console.log('DEMO_MODE:', DEMO_MODE);
    console.log('stripe:', stripe ? 'initialized' : 'null');

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
      status: 'active'
    });

    if (existingSubscription && existingSubscription.planId === planId) {
      return res.status(400).json({ message: 'You already have this subscription' });
    }

    // Delete any existing subscriptions (pending or active) to allow switching plans
    await Subscription.deleteMany({
      userId: req.user._id,
      status: { $in: ['pending', 'active'] }
    });

    let stripeSubscription = null;
    let customerId = null;

    // For free plan, skip Stripe and create subscription directly
    if (planId === 'free') {
      const subscription = new Subscription({
        userId: req.user._id,
        planId,
        status: 'active',
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: {
          adFree: false,
          offlineDownload: false,
          highQuality: false,
          prioritySupport: false,
          artistTools: false
        }
      });

      await subscription.save();

      return res.status(201).json({
        message: 'Subscription created successfully',
        subscription,
        clientSecret: null
      });
    }

    // For paid plans in DEMO mode, create subscription directly without Stripe
    if (DEMO_MODE) {
      const subscription = new Subscription({
        userId: req.user._id,
        planId,
        status: 'active', // Directly active in demo mode
        stripeSubscriptionId: 'demo_' + Date.now(),
        stripeCustomerId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
        message: 'Subscription created successfully (DEMO MODE)',
        subscription,
        clientSecret: null
      });
    }

    // For paid plans with real Stripe
    if (!plan.stripePriceId) {
      return res.status(400).json({ 
        message: 'This plan is not properly configured. Please contact support.' 
      });
    }

    // Get or create Stripe customer
    customerId = await getOrCreateStripeCustomer(req.user._id);

    // Create Stripe subscription
    console.log('Creating Stripe subscription for planId:', planId, 'priceId:', plan.stripePriceId);
    stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    console.log('✅ Stripe subscription created:', {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      has_latest_invoice: !!stripeSubscription.latest_invoice,
      has_payment_intent: !!stripeSubscription?.latest_invoice?.payment_intent
    });

    // Get invoice ID (could be string or object)
    let invoiceId = stripeSubscription.latest_invoice;
    if (typeof invoiceId === 'object' && invoiceId.id) {
      invoiceId = invoiceId.id;
    }

    // Try to get clientSecret from payment_intent
    let clientSecretFromStripe = stripeSubscription?.latest_invoice?.payment_intent?.client_secret;
    
    // If no payment_intent in subscription response, retrieve invoice and get payment intent
    if (!clientSecretFromStripe && invoiceId) {
      console.log('⚠️ No payment_intent in subscription. Retrieving invoice:', invoiceId);
      const invoice = await stripe.invoices.retrieve(invoiceId);
      console.log('Invoice retrieved:', {
        id: invoice.id,
        payment_intent_id: invoice.payment_intent,
        status: invoice.status
      });

      if (invoice.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
        clientSecretFromStripe = paymentIntent.client_secret;
        console.log('✅ Got clientSecret from invoice payment_intent:', clientSecretFromStripe ? 'YES' : 'NO');
      }
    }

    // If still no clientSecret, try finalizing the invoice to trigger payment intent creation
    if (!clientSecretFromStripe && invoiceId) {
      console.log('⚠️ Still no clientSecret. Finalizing invoice to create payment intent...');
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        
        // Only finalize if not already finalized
        if (invoice.status === 'draft') {
          await stripe.invoices.finalizeInvoice(invoiceId);
        }
        
        // Try to get payment intent from the finalized invoice
        const updatedInvoice = await stripe.invoices.retrieve(invoiceId);
        if (updatedInvoice.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(updatedInvoice.payment_intent);
          clientSecretFromStripe = paymentIntent.client_secret;
        }
        
        console.log('✅ Invoice finalized, clientSecret:', clientSecretFromStripe ? 'YES' : 'NO');
      } catch (err) {
        console.log('⚠️ Could not finalize invoice:', err.message);
      }
    }

    console.log('Final clientSecret:', clientSecretFromStripe || 'NULL - NO PAYMENT NEEDED');

    // Validate dates
    let startDate = new Date(stripeSubscription.current_period_start * 1000);
    let endDate = new Date(stripeSubscription.current_period_end * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid dates from Stripe:', { startDate, endDate });
      // Use default dates as fallback
      startDate = new Date();
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Create subscription record
    const subscription = new Subscription({
      userId: req.user._id,
      planId,
      status: 'pending',
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      features: {
        adFree: planId !== 'free',
        offlineDownload: planId === 'pro' || planId === 'premium',
        highQuality: planId === 'premium',
        prioritySupport: planId === 'premium',
        artistTools: planId === 'premium'
      }
    });

    await subscription.save();

    // Get client secret if available
    const clientSecret = stripeSubscription?.latest_invoice?.payment_intent?.client_secret || null;

    return res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
      clientSecret: clientSecret
    });
  } catch (err) {
    console.error('Create subscription error:', err);
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
