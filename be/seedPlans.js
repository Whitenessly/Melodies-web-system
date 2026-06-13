import mongoose from 'mongoose';
import SubscriptionPlan from './models/SubscriptionPlan.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect('mongodb://localhost:27017/melodies')
    .then(() => console.log('Connected to database'))
    .catch((err) => console.log('Error connecting to database', err));

const plans = [
  {
    planId: 'free',
    name: 'Free',
    description: 'Start listening to music for free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    stripePriceId: null,
    features: [
      'Basic music streaming',
      'Ad-supported',
      'Standard quality audio',
      'Create playlists',
      'Follow artists'
    ],
    isActive: true
  },
  {
    planId: 'basic',
    name: 'Basic',
    description: 'Ad-free listening and offline downloads',
    price: 499, // $4.99
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1Q4Z0nFY2V7XxABCDEF123', // Replace with actual Stripe price ID
    features: [
      'Ad-free music streaming',
      'Offline downloads (up to 3000 songs)',
      'Standard quality audio (320kbps)',
      'Create unlimited playlists',
      'Follow unlimited artists',
      'Scrobbling to external services'
    ],
    isActive: true
  },
  {
    planId: 'pro',
    name: 'Pro',
    description: 'High quality audio and exclusive artist features',
    price: 799, // $7.99
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1Q4Z0nFY2V7XxABCDEF456', // Replace with actual Stripe price ID
    features: [
      'Ad-free music streaming',
      'Offline downloads (up to 5000 songs)',
      'High quality audio (FLAC, 320kbps)',
      'Create unlimited playlists',
      'Shared playlists and collaborative editing',
      'Artist dashboard',
      'Early access to new features',
      'Music analytics'
    ],
    isActive: true
  },
  {
    planId: 'premium',
    name: 'Premium',
    description: 'Everything you need for ultimate music experience',
    price: 1199, // $11.99
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1Q4Z0nFY2V7XxABCDEF789', // Replace with actual Stripe price ID
    features: [
      'Ad-free music streaming',
      'Offline downloads (unlimited)',
      'Lossless audio (FLAC, WAV)',
      'Spatial audio with Dolby Atmos',
      'Create unlimited playlists',
      'Shared playlists and collaborative editing',
      'Full artist dashboard',
      'Advanced music analytics',
      'Priority customer support 24/7',
      'Monetization tools for artists',
      'Revenue from your streams',
      'Early access to all features'
    ],
    isActive: true
  }
];

async function seedSubscriptionPlans() {
  try {
    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing plans');

    // Insert new plans
    await SubscriptionPlan.insertMany(plans);
    console.log('Subscription plans seeded successfully');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding plans:', err);
    process.exit(1);
  }
}

seedSubscriptionPlans();
