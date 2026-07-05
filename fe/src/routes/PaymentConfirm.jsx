import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function PaymentConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useAuth();
  const { t } = useLanguage();

  const [orderId, setOrderId] = useState('');
  const [gateway, setGateway] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const order_id = params.get('orderId');
    const pay_gateway = params.get('gateway');
    const pay_status = params.get('status');

    if (order_id) setOrderId(order_id);
    if (pay_gateway) setGateway(pay_gateway);
    if (pay_status) setStatus(pay_status);

    if (pay_status === 'SUCCESS' && order_id && pay_gateway) {
      autoVerify(order_id, pay_gateway);
    }
  }, [location]);

  const autoVerify = async (orderIdVal, gatewayVal) => {
    try {
      const res = await api.post('/payments/verify', {
        orderId: orderIdVal,
        gateway: gatewayVal,
        status: 'SUCCESS'
      });
      setMessage(res.message || 'Thanh toán thành công và kích hoạt Premium!');
      await fetchProfile();
    } catch (err) {
      setMessage(t('payment_failed') + err.message);
    }
  };

  const handleVerifyPayment = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/verify', {
        orderId,
        gateway,
        status: 'SUCCESS'
      });
      setStatus('SUCCESS');
      setMessage(res.message || 'Thanh toán thành công!');
      await fetchProfile();
    } catch (err) {
      setMessage(t('payment_failed') + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex items-center justify-center">
          
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col gap-6 text-center">
            
            {/* Status Icon */}
            <div className="flex justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status === 'SUCCESS' 
                  ? 'bg-status-success/10 text-status-success' 
                  : 'bg-status-warning/10 text-status-warning animate-pulse'
              }`}>
                <span className="material-symbols-outlined text-4xl">
                  {status === 'SUCCESS' ? 'check_circle' : 'qr_code_scanner'}
                </span>
              </div>
            </div>

            <div>
              <h1 className="font-display-lg text-2xl font-bold text-white tracking-tight">
                {status === 'SUCCESS' ? t('payment_success') : t('payment_pending')}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5">
                {t('simulated_transaction_prefix')} {gateway ? gateway.toUpperCase() : 'Momo/VNPay'} Sandbox
              </p>
            </div>

            {/* Invoice parameters */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left text-xs flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t('order_id_label')}</span>
                <span className="font-mono font-bold text-white">{orderId || t('not_updated')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t('payment_method_label')}</span>
                <span className="font-bold text-white capitalize">
                  {gateway === 'stripe' ? t('credit_card') : (gateway || t('e_wallet'))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t('amount_label')}</span>
                <span className="font-bold text-tertiary">59.000 VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t('plan_duration_label')}</span>
                <span className="font-bold text-white">{t('duration_30_days')}</span>
              </div>
            </div>

            {/* Simulated scan qr code section */}
            {status !== 'SUCCESS' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-40 h-40 bg-white p-3 rounded-2xl flex items-center justify-center border border-white/10">
                  {/* Mock QR image */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=melodies-order-${orderId}`} 
                    alt="Mock QR Payment" 
                    className="w-full h-full"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed px-4">
                  {t('scan_qr_desc')}
                </p>
              </div>
            )}

            {/* Notification message */}
            {message && (
              <p className={`text-xs font-semibold ${status === 'SUCCESS' ? 'text-status-success' : 'text-status-error'}`}>
                {t(message)}
              </p>
            )}

            {/* Actions triggers */}
            <div className="flex flex-col gap-2.5 mt-2">
              {status !== 'SUCCESS' ? (
                <button 
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="w-full h-11 rounded-xl electric-btn text-white font-bold text-xs hover:scale-102 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  ) : (
                    t('confirm_payment_success')
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/home')}
                  className="w-full h-11 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition cursor-pointer"
                >
                  {t('start_listening_premium')}
                </button>
              )}
            </div>

          </div>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
