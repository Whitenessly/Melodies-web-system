# 💳 Hệ Thống Thanh Toán Stripe - Hướng Dẫn Triển Khai

## 📋 Mục Lục
1. [Tổng quan](#tổng-quan)
2. [Các Models Mới](#các-models-mới)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Cấu Hình Stripe](#cấu-hình-stripe)
6. [Hướng Dẫn Setup](#hướng-dẫn-setup)
7. [Webhook Setup](#webhook-setup)

---

## 🎯 Tổng Quan

Hệ thống thanh toán Melodies Web System tích hợp **Stripe** để quản lý:
- 📦 Subscription Plans (Basic, Pro, Premium)
- 💰 Payment Processing
- 📊 Payment History
- 🔄 Subscription Management

### Các Gói Subscription

| Plan | Giá | Tính Năng |
|------|-----|----------|
| **Free** | Miễn phí | Nghe nhạc cơ bản, có quảng cáo |
| **Basic** | $4.99/tháng | Không quảng cáo, tải offline (3000 bài) |
| **Pro** | $7.99/tháng | +Chất lượng cao, Dashboard nghệ sĩ |
| **Premium** | $11.99/tháng | +Tất cả, Lossless audio, Support 24/7 |

---

## 📦 Các Models Mới

### 1. **Subscription.js**
```javascript
{
  userId: ObjectId,
  planId: String (free|basic|pro|premium),
  status: String (active|canceled|expired|pending),
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  features: {
    adFree: Boolean,
    offlineDownload: Boolean,
    highQuality: Boolean,
    prioritySupport: Boolean,
    artistTools: Boolean
  }
}
```

### 2. **Payment.js**
```javascript
{
  userId: ObjectId,
  subscriptionId: ObjectId,
  planId: String,
  amount: Number,
  currency: String,
  status: String (pending|succeeded|failed|canceled),
  stripePaymentIntentId: String,
  stripeInvoiceId: String,
  paymentMethod: {
    type: String,
    last4: String,
    brand: String
  },
  receiptUrl: String
}
```

### 3. **SubscriptionPlan.js**
```javascript
{
  planId: String (unique),
  name: String,
  description: String,
  price: Number (in cents),
  interval: String (month|year),
  stripePriceId: String,
  features: Array<String>,
  isActive: Boolean
}
```

---

## 🔌 API Endpoints

### Public Routes
```
GET  /api/payments/plans              - Lấy danh sách gói
```

### Protected Routes (Yêu cầu Authentication)
```
GET    /api/payments/subscription           - Lấy subscription hiện tại
POST   /api/payments/subscription           - Tạo subscription mới
POST   /api/payments/subscription/confirm   - Xác nhận thanh toán
DELETE /api/payments/subscription           - Hủy subscription
GET    /api/payments/history                - Lịch sử thanh toán
POST   /api/payments/intent                 - Tạo payment intent
```

### Backend Controller Methods
- `getSubscriptionPlans()` - Lấy tất cả gói
- `getUserSubscription()` - Lấy subscription của user
- `createSubscription()` - Tạo subscription mới
- `confirmSubscriptionPayment()` - Xác nhận payment
- `cancelSubscription()` - Hủy subscription
- `getPaymentHistory()` - Lịch sử thanh toán

---

## 🎨 Frontend Components

### 1. **SubscriptionPlans.jsx**
Trang hiển thị các gói subscription có sẵn
- Danh sách gói với giá và tính năng
- Nút Subscribe
- Hiển thị subscription hiện tại

**Route:** `/subscription-plans`

### 2. **PaymentConfirm.jsx**
Trang xác nhận thanh toán với Stripe Card Element
- Nhập thông tin thẻ
- Xử lý payment intent
- Redirect sau khi thành công

**Route:** `/payment-confirm`

### 3. **PaymentHistory.jsx**
Trang lịch sử thanh toán
- Danh sách transactions
- Trạng thái payment
- Link xem receipt

**Route:** `/payment-history`

---

## 🔑 Cấu Hình Stripe

### Bước 1: Tạo Tài Khoản Stripe
1. Truy cập [https://stripe.com](https://stripe.com)
2. Click "Sign up" và đăng ký tài khoản
3. Xác minh email của bạn

### Bước 2: Lấy API Keys
1. Đăng nhập vào [Stripe Dashboard](https://dashboard.stripe.com)
2. Vào **Developers** → **API Keys**
3. Sao chép:
   - **Publishable Key** (pk_test_...) → VITE_STRIPE_PUBLIC_KEY (Frontend)
   - **Secret Key** (sk_test_...) → STRIPE_SECRET_KEY (Backend)

### Bước 3: Tạo Subscription Plans trên Stripe

1. Vào **Products** → **+ Add product**
2. Tạo 4 products (Free, Basic, Pro, Premium)
3. Thêm recurring prices cho mỗi plan

**Ví dụ:**
```
Product: Basic Plan
Price: $4.99
Interval: Monthly
Billing cycle: Month
→ Sao chép Price ID (price_1Q4Z0nFY2V7XxABCDEF123)
```

4. Cập nhật Price IDs trong `seedPlans.js`:
```javascript
{
  planId: 'basic',
  stripePriceId: 'price_1Q4Z0nFY2V7XxABCDEF123', // Your Stripe Price ID
  ...
}
```

---

## 🚀 Hướng Dẫn Setup

### Backend Setup

#### 1. Cấu Hình Environment Variables
Tạo file `.env` trong `be/`:
```env
MONGO_URI=mongodb://localhost:27017/melodies
PORT=8080
JWT_SECRET=your_secret_key_here

# Stripe
STRIPE_PUBLIC_KEY=pk_test_51QXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_51QXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

FRONTEND_URL=http://localhost:5173
```

#### 2. Seed Subscription Plans
```bash
cd be
node seedPlans.js
```

Output:
```
Connected to database
Cleared existing plans
Subscription plans seeded successfully
```

#### 3. Chạy Backend Server
```bash
npm run dev
```

### Frontend Setup

#### 1. Cấu Hình Environment Variables
Tạo file `.env` trong `fe/`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_51QXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### 2. Cài đặt Dependencies
```bash
cd fe
npm install
```

#### 3. Chạy Frontend Development Server
```bash
npm run dev
```

---

## 🪝 Webhook Setup

Stripe Webhooks cho phép nhận thông báo từ Stripe khi có sự kiện thanh toán.

### 1. Tạo Endpoint Handler (Backend)

Tạo file `be/controllers/webhookController.js`:
```javascript
import Stripe from 'stripe';
import Subscription from '../models/Subscription.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status === 'active' ? 'active' : 'canceled'
        }
      );
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: deletedSub.id },
        { status: 'canceled' }
      );
      break;

    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object);
      break;

    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object);
      break;
  }

  res.json({ received: true });
}
```

### 2. Thêm Webhook Route

```javascript
// be/routes/webhookRoutes.js
import express from 'express';
import { handleWebhook } from '../controllers/webhookController.js';

const router = express.Router();
router.post('/stripe', handleWebhook);

export default router;
```

### 3. Đăng Ký Webhook Endpoint trên Stripe

1. Vào [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. Click **+ Add endpoint**
4. **Endpoint URL:** `https://your-domain.com/webhooks/stripe`
5. **Events to send:**
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. Sao chép **Signing secret** → `STRIPE_WEBHOOK_SECRET` trong `.env`

### 4. Testing Webhooks Locally

Cài đặt Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Chocolatey)
choco install stripe

# hoặc download từ https://stripe.com/docs/stripe-cli
```

Chạy Stripe CLI:
```bash
stripe listen --forward-to localhost:8080/webhooks/stripe
```

Test một event:
```bash
stripe trigger payment_intent.succeeded
```

---

## 📝 Testing

### 1. Test Cards (Stripe Test Mode)

| Mục Đích | Card Number | CVC | Exp Date |
|---------|-------------|-----|----------|
| Success | 4242 4242 4242 4242 | 123 | 12/26 |
| Decline | 4000 0000 0000 0002 | 123 | 12/26 |
| Require Auth | 4000 0025 0000 3155 | 123 | 12/26 |

### 2. Test Flow

1. **Đăng nhập** → `/home`
2. **Vào Settings** hoặc click **Upgrade**
3. **Chọn gói** → `/subscription-plans`
4. **Click Subscribe**
5. **Nhập card test** → `/payment-confirm`
6. **Xác nhận payment**
7. **Xem lịch sử** → `/payment-history`

---

## ⚠️ Lưu Ý Quan Trọng

1. **Secret Keys**: KHÔNG commit `.env` file với real keys
2. **Test Mode**: Luôn test ở test mode trước khi production
3. **HTTPS**: Production cần HTTPS (yêu cầu của Stripe)
4. **Webhook Signing**: Luôn verify webhook signature
5. **Rate Limiting**: Thêm rate limiting trên payment endpoints
6. **Error Handling**: Xử lý lỗi gracefully trên frontend

---

## 🔗 Tài Liệu Tham Khảo

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Node SDK](https://stripe.com/docs/libraries/node)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Stripe API Reference](https://stripe.com/docs/api)

---

## ✅ Checklist Triển Khai

- [ ] Tạo Stripe account
- [ ] Lấy API keys từ Stripe
- [ ] Cấu hình `.env` backend
- [ ] Cấu hình `.env` frontend
- [ ] Tạo Subscription Plans trên Stripe Dashboard
- [ ] Seed Plans vào database (`node seedPlans.js`)
- [ ] Cài đặt dependencies frontend
- [ ] Test signup → subscription
- [ ] Setup Stripe Webhooks
- [ ] Test webhook events
- [ ] Deploy to production

---

## 🐛 Troubleshooting

### "STRIPE_SECRET_KEY is missing"
- ✅ Tạo `.env` file với key

### "Invalid Stripe Key"
- ✅ Kiểm tra key format (sk_test_... or sk_live_...)

### "PaymentIntent not found"
- ✅ Webhook secret không khớp

### "Card declined"
- ✅ Dùng test card `4242 4242 4242 4242`

---

Được tạo: 13/06/2026
Version: 1.0
