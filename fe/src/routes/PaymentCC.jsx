import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function PaymentCC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') || 'premium';
  const { fetchProfile } = useAuth();
  const { t } = useLanguage();

  // Stripe configurations loaded from server
  const [publishableKey, setPublishableKey] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Card input states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null); // stores transaction details on success

  // Fetch publishable key on mount
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await api.get('/payments/gateways');
        if (res.stripe?.enabled && res.stripe?.publishableKey) {
          setPublishableKey(res.stripe.publishableKey);
        } else {
          setErrorMessage(t('stripe_not_configured'));
        }
      } catch (err) {
        console.error('Failed to fetch Stripe configuration:', err);
        setErrorMessage(t('failed_load_config'));
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchKeys();
  }, []);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Format Expiry Date (adds '/' after 2 digits)
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  // Format CVV (digits only, max 3)
  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(val);
  };

  // Detect card brand (Visa starts with 4, Mastercard with 5)
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (cleanNum.startsWith('5')) return 'mastercard';
    return 'unknown';
  };


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!publishableKey) {
      setErrorMessage(t('no_stripe_pub_key'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Validate expiry format
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        throw new Error(t('expiry_invalid'));
      }

      const expMonth = cardExpiry.split('/')[0];
      const expYear = '20' + cardExpiry.split('/')[1];

      // Call Stripe REST API directly to create the card token
      const upperCardName = (cardName.trim() || 'NGUYEN VAN A').toUpperCase();
      const params = new URLSearchParams();
      params.append('card[number]', cardNumber.replace(/\s+/g, ''));
      params.append('card[exp_month]', expMonth);
      params.append('card[exp_year]', expYear);
      params.append('card[cvc]', cardCvv);
      params.append('card[name]', upperCardName);

      const tokenResponse = await fetch('https://api.stripe.com/v1/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${publishableKey}`
        },
        body: params.toString()
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error.message);
      }

      // Post token to backend charge endpoint
      const chargeRes = await api.post('/payments/charge-card', {
        tokenId: tokenData.id,
        planId: planId,
        cardName: upperCardName,
        cardNumber: cardNumber,
        cardExpiry: cardExpiry
      });

      if (chargeRes.success) {
        setSuccessData(chargeRes.transaction);
        await fetchProfile(); // refresh premium status
      } else {
        throw new Error(chargeRes.message || t('payment_failed_err'));
      }
    } catch (err) {
      setErrorMessage(err.message || t('payment_failed_err'));
    } finally {
      setLoading(false);
    }
  };

  const cardBrand = getCardBrand();

  return (
    <div className="min-h-screen bg-[#141313] text-[#e5e2e1] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex items-center justify-center relative">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-container/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          {!successData ? (
            /* PAYMENT FORM SCREEN */
            <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6">
              
              <div className="text-center flex flex-col gap-2">
                <h1 className="font-display-lg text-2xl font-bold text-white tracking-tight">Melodies</h1>
                <p className="text-xs text-on-surface-variant">{t('payment_secure_desc')}</p>
              </div>

              {errorMessage && (
                <div className="bg-status-error/15 border border-status-error/30 text-status-error px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* LIVE CARD PREVIEW GRAPHIC */}
              <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-[#2E5BFF] to-[#8A3FFC] rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/10 select-none">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-black/20 rounded-full blur-2xl"></div>
                
                {/* Gold chip and Brand Logo */}
                <div className="flex justify-between items-center relative z-10">
                  {/* Gold Chip CSS representation */}
                  <div className="w-11 h-9 rounded-md bg-gradient-to-br from-[#e5c158] to-[#c5a038] p-1 flex flex-col justify-between border border-[#b2902f] shadow-inner relative">
                    <div className="w-full h-[1px] bg-black/10 absolute top-1/2 left-0 -translate-y-1/2"></div>
                    <div className="w-[1px] h-full bg-black/10 absolute left-1/3 top-0"></div>
                    <div className="w-[1px] h-full bg-black/10 absolute left-2/3 top-0"></div>
                  </div>

                  {/* Brand badge */}
                  <div>
                    {cardBrand === 'visa' && (
                      <span className="text-white font-extrabold italic text-xl tracking-wider">VISA</span>
                    )}
                    {cardBrand === 'mastercard' && (
                      <span className="text-white font-extrabold italic text-xl tracking-wider flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-error/90 inline-block"></span>
                        <span className="w-4 h-4 rounded-full bg-warning/90 -ml-2 inline-block"></span>
                      </span>
                    )}
                    {cardBrand === 'unknown' && (
                      <span className="material-symbols-outlined text-white/50 text-2xl">credit_card</span>
                    )}
                  </div>
                </div>

                {/* Card Number */}
                <div className="text-white font-mono text-lg md:text-xl tracking-[0.18em] my-4 text-center drop-shadow-md relative z-10">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                {/* Cardholder name and Expiry */}
                <div className="flex justify-between items-end relative z-10 text-white drop-shadow-md">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-white/60 block">{t('cardholder_name_preview')}</span>
                    <span className="text-xs font-mono font-bold tracking-wider truncate max-w-[200px] inline-block uppercase">
                      {cardName || 'NAME ON CARD'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-wider text-white/60 block">{t('card_expiry_preview')}</span>
                    <span className="text-xs font-mono font-bold tracking-wider">
                      {cardExpiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">{t('cardholder_name_label')}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      placeholder="NGUYEN VAN A"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/15 focus:bg-white/10 transition uppercase"
                    />
                    <span className="material-symbols-outlined text-sm text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2">person</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">{t('card_number_label')}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full h-11 pl-4 pr-10 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/15 focus:bg-white/10 transition font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                      {cardBrand === 'visa' && <span className="text-white font-extrabold italic text-[10px] tracking-wider">VISA</span>}
                      {cardBrand === 'mastercard' && <span className="text-white font-extrabold italic text-[10px] tracking-wider">MC</span>}
                      {cardBrand === 'unknown' && <span className="material-symbols-outlined text-sm text-on-surface-variant">credit_card</span>}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">{t('expiry_date_label')}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/15 focus:bg-white/10 transition font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">{t('cvv_code_label')}</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        required 
                        placeholder="***"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        className="w-full h-11 pl-4 pr-10 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/15 focus:bg-white/10 transition font-mono"
                      />
                      <span className="material-symbols-outlined text-sm text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2">lock</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || loadingConfig}
                  className="w-full h-11 rounded-xl bg-electric-gradient text-white font-bold text-xs hover:scale-102 transition cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      <span>{t('processing_transaction')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('pay_now_btn')}</span>
                      <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
                    </>
                  )}
                </button>

                <p className="text-[9px] text-center text-status-success font-semibold flex items-center justify-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs select-none">verified_user</span>
                  {t('ssl_security_notice')}
                </p>
              </form>
            </div>
          ) : (
            /* SUCCESS CONFIRM SCREEN */
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 text-center animate-fadeIn">
              
              {/* Success Check Badge */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-status-success/15 text-status-success flex items-center justify-center shadow-lg shadow-status-success/10 border border-status-success/20">
                  <span className="material-symbols-outlined text-4xl select-none font-bold">check</span>
                </div>
              </div>

              <div>
                <h1 className="font-display-lg text-2xl font-bold text-white tracking-tight">{t('payment_success_title')}</h1>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  {t('payment_success_desc')}
                </p>
              </div>

              {/* Bill invoice details box */}
              <div className="bg-white/5 p-4.5 rounded-2xl border border-white/5 text-left text-xs flex flex-col gap-3.5 font-inter">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{t('invoice_service')}</span>
                  <span className="font-bold text-white">VibeStream Premium</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{t('invoice_transaction_id')}</span>
                  <span className="font-mono font-bold text-white/90">#{successData.orderId?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{t('invoice_method')}</span>
                  <span className="font-bold text-white flex items-center gap-1 uppercase">
                    💳 {successData.cardBrand} **** {successData.last4}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                  <span className="text-on-surface-variant font-medium">{t('invoice_total')}</span>
                  <span className="font-bold text-status-success text-sm">
                    {(successData.amount).toLocaleString('vi-VN')} {t('billing_and_plans').includes('Billing') ? 'VND/month' : 'đ/tháng'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 mt-1.5">
                <button 
                  onClick={() => navigate('/home')}
                  className="w-full h-11 rounded-xl bg-electric-gradient text-white font-bold text-xs hover:scale-102 transition cursor-pointer shadow-lg shadow-primary/20"
                >
                  {t('back_to_home')}
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="text-[11px] text-on-surface-variant hover:text-white font-semibold transition"
                >
                  {t('view_invoice_details')}
                </button>
              </div>

              <div className="text-[9px] text-on-surface-variant/40 flex items-center justify-center gap-1 border-t border-white/5 pt-4">
                <span className="material-symbols-outlined text-xs select-none">lock</span>
                <span>{t('secure_transaction_footer')}</span>
              </div>
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
