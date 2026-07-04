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
    name: 'Miễn phí',
    description: 'Trải nghiệm cơ bản',
    price: 0,
    currency: 'vnd',
    interval: 'month',
    stripePriceId: null,
    features: [
      'Nghe hàng triệu bài hát',
      'Tạo playlist cá nhân',
      'Có quảng cáo xen kẽ',
      'Chất lượng âm thanh tiêu chuẩn'
    ],
    isActive: true
  },
  {
    planId: 'premium',
    name: 'Premium',
    description: 'Dành cho Audiophile',
    price: 59000,
    currency: 'vnd',
    interval: 'month',
    stripePriceId: null,
    features: [
      'Không quảng cáo',
      'Âm thanh 320kbps cực đỉnh',
      'Tải nhạc nghe Offline',
      'Chuyển bài không giới hạn',
      'Hỗ trợ đa thiết bị'
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
