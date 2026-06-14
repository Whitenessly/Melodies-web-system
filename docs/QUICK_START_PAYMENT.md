# 💳 Payment System - Quick Start Guide

## 🚀 Triển Khai Nhanh (5 phút)

### Backend

```bash
# 1. Cầu hình Environment
# Tạo file: be/.env
# Copy nội dung từ be/.env.example
# Thêm Stripe keys từ https://dashboard.stripe.com

# 2. Seed Subscription Plans
cd be
node seedPlans.js

# 3. Chạy server
npm run dev
```

### Frontend

```bash
# 1. Cấu hình Environment
# Tạo file: fe/.env
# Copy nội dung từ fe/.env.example
# Thêm Stripe public key

# 2. Cài dependencies
cd fe
npm install

# 3. Chạy frontend
npm run dev
```

---

## 📍 Các Routes Mới

### Frontend Pages
- `GET /subscription-plans` - Danh sách gói
- `GET /payment-confirm` - Xác nhận thanh toán
- `GET /payment-history` - Lịch sử thanh toán

### Backend APIs
- `GET /api/payments/plans` - Danh sách gói
- `POST /api/payments/subscription` - Tạo subscription
- `POST /api/payments/subscription/confirm` - Xác nhận payment
- `DELETE /api/payments/subscription` - Hủy subscription
- `GET /api/payments/history` - Lịch sử
- `POST /webhooks/stripe` - Webhook endpoint

---

## 🧪 Testing

1. Truy cập `http://localhost:5173/subscription-plans`
2. Chọn gói muốn subscribe
3. Nhập test card: `4242 4242 4242 4242`
4. CVC: `123`, Exp: `12/26`
5. Check `/payment-history`

---

## ⚙️ Cấu Hình Stripe (Chi tiết)

Xem file: `PAYMENT_SYSTEM_SETUP.md`

---

## 📦 Files Mới Tạo

### Backend
- `models/Subscription.js`
- `models/Payment.js`
- `models/SubscriptionPlan.js`
- `controllers/paymentController.js`
- `controllers/webhookController.js`
- `routes/paymentRoutes.js`
- `routes/webhookRoutes.js`
- `seedPlans.js`

### Frontend
- `routes/SubscriptionPlans.jsx`
- `routes/PaymentConfirm.jsx`
- `routes/PaymentHistory.jsx`

### Config
- `be/.env.example` (updated)
- `fe/.env.example` (created)
- `PAYMENT_SYSTEM_SETUP.md`

---

## ✅ Giai Đoạn 1 Hoàn Thành

✅ **Đã triển khai:**
- Subscription models
- Payment processing
- Stripe integration
- Frontend UI cho subscriptions
- Webhook handling
- Payment history tracking

📊 **Tiến độ:** 100% Giai đoạn 1

🎯 **Tiếp theo:** Giai đoạn 2
- Download & Offline mode
- Advanced player features
- Artist revenue dashboard

---

Được tạo: 13/06/2026
