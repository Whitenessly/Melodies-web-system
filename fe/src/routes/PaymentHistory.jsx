import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await api.get('/payments/history');
        setPayments(data.payments || []);
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
        return 'text-success bg-success/10 border-success/20';
      case 'pending':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'failed':
        return 'text-error bg-error/10 border-error/20';
      case 'canceled':
        return 'text-outline bg-outline/10 border-outline/20';
      default:
        return 'text-on-surface-variant';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-primary">Loading payment history...</span>
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

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
                receipt_long
              </span>
              <p className="text-on-surface-variant">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="border border-outline rounded-lg p-4 bg-surface-dim hover:bg-surface transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-on-background mb-2">
                        {payment.description || `${payment.planId.toUpperCase()} Subscription`}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {formatDate(payment.createdAt)}
                      </p>
                      {payment.paymentMethod?.last4 && (
                        <p className="text-sm text-on-surface-variant">
                          {payment.paymentMethod.brand?.toUpperCase()} ••••{payment.paymentMethod.last4}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-on-background">
                          ${(payment.amount / 100).toFixed(2)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>

                      {payment.receiptUrl && (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline flex items-center gap-1"
                        >
                          <span>View Receipt</span>
                          <span className="material-symbols-outlined text-lg">open_in_new</span>
                        </a>
                      )}
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
