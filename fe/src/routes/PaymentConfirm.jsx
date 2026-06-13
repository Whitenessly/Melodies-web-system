import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../utils/api.js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ subscription, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        subscription.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {}
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on backend
        await api.post('/payments/subscription/confirm', {
          paymentIntentId: paymentIntent.id
        });
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-outline rounded-lg bg-surface-dim">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${(subscription.amount / 100).toFixed(2)}`}
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
      setSubscription(JSON.parse(pendingData));
      setLoading(false);
    } else {
      navigate('/subscription-plans');
    }
  }, [navigate]);

  const handlePaymentSuccess = () => {
    sessionStorage.removeItem('pendingSubscription');
    alert('Payment successful! Your subscription is now active.');
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-primary">Loading...</span>
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
          <p className="text-on-surface-variant mb-6">
            Subscribe to {subscription?.planName} plan
          </p>

          <Elements stripe={stripePromise}>
            <PaymentForm subscription={subscription} onSuccess={handlePaymentSuccess} />
          </Elements>

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
