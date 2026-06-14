import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setError(null);
        const data = await api.get('/payments/history');
        setPayments(data.payments || []);
      } catch (err) {
        console.error('Failed to load payment history:', err);
        setError('Failed to load payment history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'canceled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-on-surface-variant';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'cancel';
      case 'canceled':
        return 'block';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">
            sync
          </span>
          <span className="text-primary">Loading payment history...</span>
        </div>
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
            Payment History
          </h1>
          <p className="text-on-surface-variant mb-8">
            View all your transactions and invoices
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="text-error flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </p>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
                receipt_long
              </span>
              <p className="text-on-surface-variant">No payments yet</p>
              <p className="text-on-surface-variant text-sm mt-2">
                Your payment transactions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="border border-outline rounded-lg p-4 bg-surface-dim hover:bg-surface transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-on-background mb-2">
                        {payment.description || `${payment.planId?.toUpperCase()} Subscription`}
                      </h3>
                      <p className="text-sm text-on-surface-variant mb-1">
                        {formatDate(payment.createdAt)}
                      </p>
                      {payment.paymentMethod?.last4 && (
                        <p className="text-sm text-on-surface-variant">
                          {payment.paymentMethod.brand?.toUpperCase() || 'Card'} ••••{payment.paymentMethod.last4}
                        </p>
                      )}
                      {payment.stripePaymentIntentId && (
                        <p className="text-xs text-on-surface-variant mt-1 font-mono">
                          ID: {payment.stripePaymentIntentId.substring(0, 20)}...
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-on-background">
                          ${(payment.amount / 100).toFixed(2)}
                        </p>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border capitalize mt-1 ${getStatusColor(payment.status)}`}>
                          <span className="material-symbols-outlined text-sm">
                            {getStatusIcon(payment.status)}
                          </span>
                          {payment.status}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline flex items-center gap-1 px-3 py-1 border border-primary rounded hover:bg-primary/5 transition"
                          >
                            <span>Receipt</span>
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                          </a>
                        )}
                        {payment.invoiceUrl && (
                          <a
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline flex items-center gap-1 px-3 py-1 border border-primary rounded hover:bg-primary/5 transition"
                          >
                            <span>Invoice</span>
                            <span className="material-symbols-outlined text-lg">download</span>
                          </a>
                        )}
                      </div>
                    </div>
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

export default PaymentHistory;
