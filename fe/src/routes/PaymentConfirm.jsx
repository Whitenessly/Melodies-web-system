import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api.js';

const PaymentForm = ({ subscription, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardElement, setCardElement] = useState(null);

  useEffect(() => {
    // Load Stripe from CDN
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      const stripeInstance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      setStripe(stripeInstance);
      
      // Create card element
      const elements = stripeInstance.elements();
      const card = elements.create('card');
      card.mount('#card-element');
      setCardElement(card);

      // Handle card errors
      card.addEventListener('change', (event) => {
        if (event.error) {
          setError(event.error.message);
        } else {
          setError(null);
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !cardElement) {
      setError('Stripe is loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(subscription.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: 'Customer' }
        }
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment successful - confirm on backend
        await api.post('/payments/subscription/confirm', {
          subscriptionId: subscription.subscriptionId,
          paymentIntentId: result.paymentIntent.id
        });

        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-outline rounded-lg bg-surface-dim">
        <div id="card-element" className="p-3 border border-outline rounded bg-background"></div>
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};


const PaymentConfirm = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingSubscription');
    if (pendingData) {
      const data = JSON.parse(pendingData);
      setSubscription(data);
      
      // If no clientSecret, it means demo mode - auto confirm
      if (!data.clientSecret) {
        setTimeout(() => {
          handlePaymentSuccess();
        }, 1500);
      }
      
      setLoading(false);
    } else {
      navigate('/subscription-plans');
    }
  }, [navigate]);

  const handlePaymentSuccess = () => {
    sessionStorage.removeItem('pendingSubscription');
    alert('✅ Payment successful! Your subscription is now active.');
    // Reload to fetch updated subscription
    window.location.href = '/subscription-plans';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-primary">Loading...</span>
      </div>
    );
  }

  // If no clientSecret, show demo mode message
  if (!subscription?.clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-dim rounded-lg border border-outline p-8 text-center">
            <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
              ✅ Subscription Activated
            </h1>
            <p className="text-on-surface-variant mb-4">
              Welcome to {subscription?.planName} plan!
            </p>
            <p className="text-on-surface text-sm text-primary">
              (Demo Mode - No payment required)
            </p>
            <button
              onClick={() => navigate('/subscription-plans')}
              className="w-full mt-6 py-2 px-4 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition"
            >
              Continue to Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-dim rounded-lg border border-outline p-8">
          <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
            Complete Payment
          </h1>
          <p className="text-on-surface-variant mb-2">
            Subscribe to {subscription?.planName}
          </p>
          <p className="text-on-surface text-xs text-primary mb-6">
            Use test card: 4242 4242 4242 4242 | 12/26 | 123
          </p>

          <PaymentForm subscription={subscription} onSuccess={handlePaymentSuccess} />

          <button
            onClick={() => navigate('/subscription-plans')}
            className="w-full mt-4 py-2 px-4 border border-outline text-on-background rounded-lg hover:bg-surface transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
