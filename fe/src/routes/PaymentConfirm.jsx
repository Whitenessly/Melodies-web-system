import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const PaymentForm = ({ subscription, onSuccess, onError, userInfo, autoSubmit }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded yet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        subscription.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: userInfo.fullName,
              email: userInfo.email,
              address: {
                line1: userInfo.address,
                city: userInfo.city,
                state: userInfo.state,
                postal_code: userInfo.postalCode,
                country: userInfo.country
              }
            }
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError.message);
        setLoading(false);
      } else if (paymentIntent.status === 'succeeded') {
        try {
          // Confirm on backend
          await api.post('/payments/subscription/confirm', {
            subscriptionId: subscription.subscriptionId,
            paymentIntentId: paymentIntent.id
          });

          onSuccess();
        } catch (err) {
          setError('Payment succeeded but confirmation failed. Please contact support.');
          onError?.('Payment succeeded but confirmation failed');
          setLoading(false);
        }
      } else {
        setError('Payment failed with status: ' + paymentIntent.status);
        onError?.('Payment status: ' + paymentIntent.status);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      onError?.(err.message);
      setLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Information */}
      <div>
        <h3 className="font-headline-md text-headline-md text-on-background mb-4">
          Card Information
        </h3>
        <div className="p-4 border border-outline rounded-lg bg-surface-dim">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: 'inherit',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  '::placeholder': {
                    color: '#9CA3AF'
                  }
                },
                invalid: {
                  color: '#EF4444'
                }
              },
              hidePostalCode: true
            }}
            className="p-3"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error rounded text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
        {loading ? 'Processing Payment...' : `Pay $${(subscription.amount / 100).toFixed(2)}`}
      </button>

      <p className="text-xs text-on-surface-variant text-center">
        This is a secure payment. Your card details are handled by Stripe.
      </p>
    </form>
  );
};

const PaymentConfirm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });
  const [errors, setErrors] = useState({});

  const [autoSubmit, setAutoSubmit] = useState(false);

  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingSubscription');
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        console.log('📦 Payment data:', {
          planId: data.planId,
          hasClientSecret: !!data.clientSecret
        });
        setSubscription(data);

        // Only auto-submit if clientSecret is null (demo mode)
        // If clientSecret exists, show payment form
        if (data.clientSecret === null || data.clientSecret === undefined) {
          console.log('🤖 Auto-submit enabled (demo mode)');
          setAutoSubmit(true);
        } else {
          console.log('💳 Show payment form (has clientSecret)');
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Parse error:', err);
        setError('Invalid subscription data');
        setLoading(false);
      }
    } else {
      navigate('/subscription-plans');
    }
  }, [navigate]);

  const handlePaymentSuccess = () => {
    sessionStorage.removeItem('pendingSubscription');
    alert('✅ Payment successful! Your subscription is now active.');
    // Redirect to subscription plans with success indicator
    navigate('/subscription-plans?payment=success');
  };

  const handlePaymentError = (errorMsg) => {
    setError(errorMsg);
    console.error('Payment error:', errorMsg);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!userInfo.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!userInfo.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) newErrors.email = 'Invalid email';
    if (!userInfo.address.trim()) newErrors.address = 'Address is required';
    if (!userInfo.city.trim()) newErrors.city = 'City is required';
    if (!userInfo.state.trim()) newErrors.state = 'State/Province is required';
    if (!userInfo.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">
            sync
          </span>
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    );
  }

  // If auto-submit mode (demo mode), show demo page
  if (autoSubmit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-dim rounded-lg border border-outline p-8 text-center space-y-4">
            <div className="flex justify-center">
              <span className="material-symbols-outlined text-6xl text-primary">
                check_circle
              </span>
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
                Subscription Activated
              </h1>
              <p className="text-on-surface-variant mb-2">
                Welcome to <strong>{subscription?.planName}</strong> plan!
              </p>
              <p className="text-on-surface-variant text-sm">
                💡 Demo Mode: Your subscription is ready to use
              </p>
              <p className="text-on-surface-variant text-xs mt-3">
                (In production, Stripe payment will be required here)
              </p>
            </div>
            <button
              onClick={handlePaymentSuccess}
              className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <h1 className="font-headline-xl text-headline-xl text-on-background">
            Complete Payment
          </h1>
          <p className="text-on-surface-variant mt-2">
            Subscribe to <strong>{subscription?.planName}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Summary */}
            <div className="bg-surface-dim border border-outline rounded-lg p-6">
              <h2 className="font-headline-md text-headline-md text-on-background mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-outline">
                  <div>
                    <p className="text-on-background font-medium">{subscription?.planName} Plan</p>
                    <p className="text-sm text-on-surface-variant">Monthly subscription</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    ${(subscription?.amount / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <p className="text-on-background font-medium">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    ${(subscription?.amount / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-surface-dim border border-outline rounded-lg p-6">
              <h2 className="font-headline-md text-headline-md text-on-background mb-6">
                Billing Information
              </h2>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={userInfo.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.fullName && <p className="text-error text-sm mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={userInfo.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                    className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.address && <p className="text-error text-sm mt-1">{errors.address}</p>}
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-background mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={userInfo.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.city && <p className="text-error text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-background mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={userInfo.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.state && <p className="text-error text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>

                {/* Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-background mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={userInfo.postalCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.postalCode && <p className="text-error text-sm mt-1">{errors.postalCode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-background mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={userInfo.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-outline rounded-lg bg-background text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="VN">Vietnam</option>
                      <option value="SG">Singapore</option>
                      <option value="TH">Thailand</option>
                      <option value="PH">Philippines</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-surface-dim border border-outline rounded-lg p-6">
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  subscription={subscription} 
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  userInfo={userInfo}
                  autoSubmit={autoSubmit}
                />
              </Elements>
            </div>

            {/* Terms */}
            <div className="text-xs text-on-surface-variant text-center">
              <p>
                By clicking "Pay" you agree to our terms. Your subscription will renew automatically.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Test Card Info */}
            <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
              <p className="text-xs font-medium text-primary mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Test Mode
              </p>
              <p className="text-xs text-on-surface-variant mb-3">
                Use these test card details:
              </p>
              <div className="space-y-2 text-xs font-mono bg-background p-3 rounded border border-primary/20">
                <p className="text-on-surface-variant">
                  <span className="text-on-surface-variant/60">Card:</span>
                  <br />
                  <span className="text-primary">4242 4242 4242 4242</span>
                </p>
                <p className="text-on-surface-variant">
                  <span className="text-on-surface-variant/60">Expiry:</span>
                  <br />
                  <span className="text-primary">12/26</span>
                </p>
                <p className="text-on-surface-variant">
                  <span className="text-on-surface-variant/60">CVC:</span>
                  <br />
                  <span className="text-primary">123</span>
                </p>
              </div>
            </div>

            {/* Plan Details */}
            <div className="bg-surface-dim border border-outline rounded-lg p-4 sticky top-4">
              <h3 className="font-medium text-on-background mb-4">Plan Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Plan</span>
                  <span className="font-medium text-on-background">{subscription?.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Price</span>
                  <span className="font-medium text-on-background">
                    ${(subscription?.amount / 100).toFixed(2)}/month
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-outline">
                  <span className="text-on-surface-variant">Renewal</span>
                  <span className="font-medium text-on-background">Monthly</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  You can cancel your subscription anytime from your account settings.
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => navigate('/subscription-plans')}
              className="w-full mt-6 py-2 px-4 border border-outline text-on-background rounded-lg hover:bg-surface transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
