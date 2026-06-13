import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansData = await api.get('/payments/plans');
        setPlans(plansData.plans || []);

        if (user) {
          const subData = await api.get('/payments/subscription');
          setCurrentSubscription(subData.subscription);
        }
      } catch (err) {
        console.error('Failed to load subscription data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setProcessingPlan(plan.planId);
    try {
      // Create subscription
      const response = await api.post('/payments/subscription', {
        planId: plan.planId
      });

      // If payment is required, redirect to payment confirmation page
      if (response.clientSecret) {
        // Store subscription data in session
        sessionStorage.setItem('pendingSubscription', JSON.stringify({
          subscriptionId: response.subscription._id,
          clientSecret: response.clientSecret,
          planId: plan.planId,
          planName: plan.name
        }));

        navigate('/payment-confirm');
      } else {
        // Free plan - subscription created successfully
        alert(`Successfully subscribed to ${plan.name} plan!`);
        window.location.reload();
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to subscribe'}`);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      await api.delete('/payments/subscription');
      alert('Subscription canceled successfully');
      window.location.reload();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to cancel'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-5xl animate-spin text-primary mb-4">sync</span>
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

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="mb-8 p-4 bg-primary/10 border border-primary rounded-lg">
              <p className="text-on-background mb-2">
                <strong>Current Plan:</strong> {currentSubscription.planId.toUpperCase()}
              </p>
              <p className="text-on-surface-variant text-sm mb-4">
                Status: <span className="capitalize text-primary font-medium">{currentSubscription.status}</span>
              </p>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-error/20 text-error rounded hover:bg-error/30 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`rounded-lg border transition-all ${
                  currentSubscription?.planId === plan.planId
                    ? 'border-primary bg-primary/5'
                    : 'border-outline bg-surface-dim hover:border-primary'
                }`}
              >
                <div className="p-6">
                  <h3 className="font-headline-md text-headline-md text-on-background mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-on-surface-variant text-sm mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-headline-lg text-primary font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-headline-lg text-primary font-bold">
                          ${(plan.price / 100).toFixed(2)}
                        </span>
                        <span className="text-on-surface-variant text-sm">/{plan.interval}</span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">
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
                      className="w-full py-2 px-4 bg-primary/30 text-primary rounded-lg font-medium cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={processingPlan === plan.planId}
                      className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {processingPlan === plan.planId ? 'Processing...' : 'Subscribe'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default SubscriptionPlans;
