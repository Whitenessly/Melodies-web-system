import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useSearchParams } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    try {
      setError(null);
      const plansData = await api.get('/payments/plans');
      setPlans(plansData.plans || []);

      if (user) {
        const subData = await api.get('/payments/subscription');
        setCurrentSubscription(subData.subscription);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError('Failed to load subscription plans. Please try again later.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchSubscriptionData();
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Check if returning from successful payment
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccessMessage('✅ Payment successful! Your subscription has been activated.');
      // Refresh subscription data
      fetchSubscriptionData();
      // Clear the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Clear message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setProcessingPlan(plan.planId);
    setError(null);
    
    try {
      console.log('🔄 Subscribing to plan:', plan.planId);
      
      // Create subscription
      const response = await api.post('/payments/subscription', {
        planId: plan.planId
      });

      console.log('✅ Subscription response:', response);

      // Always update current subscription after successful subscribe
      if (response.subscription) {
        setCurrentSubscription(response.subscription);
      }

      // For free plan: subscription created successfully
      if (plan.planId === 'free') {
        setSuccessMessage(`✅ Successfully subscribed to ${plan.name} plan!`);
        await fetchSubscriptionData();
        setTimeout(() => setSuccessMessage(null), 5000);
      } 
      // For paid plans: always go to payment page (with or without clientSecret)
      else {
        // Store subscription data in session
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          subscriptionId: response.subscription._id,
          clientSecret: response.clientSecret || null, // null for demo mode
          planId: plan.planId,
          planName: plan.name,
          amount: plan.price
        }));

        console.log('🔀 Navigating to payment confirm page');
        navigate('/payment-confirm');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to subscribe';
      setError(errorMessage);
      console.error('❌ Subscription error:', err);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setError(null);
    
    try {
      await api.delete('/payments/subscription');
      alert('✅ Subscription canceled successfully');
      window.location.reload();
    } catch (err) {
      const errorMessage = err.message || 'Failed to cancel subscription';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-5xl animate-spin text-primary mb-4">
          sync
        </span>
        <span className="text-primary">Loading plans...</span>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-sidebar-width pb-20 min-h-screen bg-background">
        <Header />
        
        <div className="px-gutter-desktop py-8">
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">
            Subscription Plans
          </h1>
          <p className="text-on-surface-variant mb-8">
            Choose the perfect plan for your music experience
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg animate-pulse">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="text-error flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="mb-8 p-4 bg-primary/10 border border-primary rounded-lg">
              <p className="text-on-background mb-2">
                <strong>Current Plan:</strong> {currentSubscription.planId.toUpperCase()}
              </p>
              <p className="text-on-surface-variant text-sm mb-4">
                Status: <span className="capitalize text-primary font-medium">{currentSubscription.status}</span>
              </p>
              {currentSubscription.currentPeriodEnd && (
                <p className="text-on-surface-variant text-sm mb-4">
                  Renews on: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {currentSubscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-error/20 text-error rounded hover:bg-error/30 transition font-medium"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          )}

          {/* Plans Grid */}
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-on-surface-variant">No plans available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`rounded-lg border transition-all overflow-hidden ${
                    currentSubscription?.planId === plan.planId
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-outline bg-surface-dim hover:border-primary hover:bg-surface'
                  }`}
                >
                  <div className="p-6">
                    <h3 className="font-headline-md text-headline-md text-on-background mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-on-surface-variant text-sm mb-4 h-10">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      {plan.price === 0 ? (
                        <span className="text-headline-lg text-primary font-bold">Free</span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-headline-lg text-primary font-bold">
                              ${(plan.price / 100).toFixed(2)}
                            </span>
                            <span className="text-on-surface-variant text-sm">
                              /{plan.interval}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mb-6 space-y-2">
                      {plan.features && plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {currentSubscription?.planId === plan.planId ? (
                      <button
                        disabled
                        className="w-full py-2 px-4 bg-primary/30 text-primary rounded-lg font-medium cursor-not-allowed opacity-60"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={processingPlan === plan.planId}
                        className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPlan === plan.planId ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm animate-spin">
                              sync
                            </span>
                            Processing...
                          </span>
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default SubscriptionPlans;
