import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState('momo'); // 'momo', 'vnpay', 'stripe'
  const [openFaq, setOpenFaq] = useState(null);
  const [gateways, setGateways] = useState({
    momo: { enabled: false },
    vnpay: { enabled: false },
    stripe: { enabled: false, publishableKey: '' }
  });

  const loadGateways = async () => {
    try {
      const res = await api.get('/payments/gateways');
      setGateways(res);
      
      // Automatically select first enabled gateway
      if (res.momo?.enabled) setSelectedGateway('momo');
      else if (res.vnpay?.enabled) setSelectedGateway('vnpay');
      else if (res.stripe?.enabled) setSelectedGateway('stripe');
    } catch (err) {
      console.log('Failed to load gateways configuration:', err);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await api.get('/admin/plans');
      setPlans(data);
    } catch (err) {
      console.log('Failed to fetch pricing plans:', err.message);
      // Fallback mockup
      setPlans([
        {
          planId: 'free',
          name: 'Miễn phí',
          price: 0,
          description: 'Trải nghiệm cơ bản',
          features: [
            'Nghe hàng triệu bài hát',
            'Tạo playlist cá nhân',
            'Có quảng cáo xen kẽ',
            'Chất lượng âm thanh tiêu chuẩn'
          ]
        },
        {
          planId: 'premium',
          name: 'Premium',
          price: 59000,
          description: 'Dành cho Audiophile',
          features: [
            'Không quảng cáo',
            'Âm thanh 320kbps cực đỉnh',
            'Tải nhạc nghe Offline',
            'Chuyển bài không giới hạn',
            'Hỗ trợ đa thiết bị'
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadGateways();
  }, []);

  const handleSubscribe = async (plan) => {
    if (plan.price === 0 || plan.planId === 'free') {
      alert(t('already_free'));
      return;
    }

    if (user?.premium_status === 'PREMIUM') {
      alert(t('already_premium'));
      return;
    }

    if (selectedGateway === 'stripe') {
      navigate(`/payment-cc?planId=${plan.planId}`);
      return;
    }

    try {
      const res = await api.post('/payments/create', {
        planId: plan.planId,
        gateway: selectedGateway
      });

      if (res.payment_url) {
        if (res.payment_url.startsWith('http')) {
          window.location.href = res.payment_url;
        } else {
          navigate(res.payment_url);
        }
      }
    } catch (err) {
      alert(t('payment_failed') + err.message);
    }
  };

  const freePlan = plans.find(p => p.planId === 'free') || {
    planId: 'free',
    name: 'Miễn phí',
    price: 0,
    description: 'Trải nghiệm cơ bản',
    features: ['Nghe hàng triệu bài hát', 'Tạo playlist cá nhân', 'Có quảng cáo xen kẽ', 'Chất lượng âm thanh tiêu chuẩn']
  };

  const premiumPlan = plans.find(p => p.planId === 'premium') || {
    planId: 'premium',
    name: 'Premium',
    price: 59000,
    description: 'Dành cho Audiophile',
    features: ['Không quảng cáo', 'Âm thanh 320kbps cực đỉnh', 'Tải nhạc nghe Offline', 'Chuyển bài không giới hạn', 'Hỗ trợ đa thiết bị']
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto overflow-x-hidden flex flex-col gap-10 relative">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mt-4">
            <span className="inline-block self-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary font-bold text-xs tracking-widest uppercase select-none font-semibold">
              {t('pricing_plans_badge')}
            </span>
            <h2 className="font-display-lg text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {t('pricing_title_line1')}<br/>
              <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">{t('pricing_title_line2')}</span>
            </h2>
            <p className="text-sm text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-medium">
              {t('pricing_desc')}
            </p>
          </div>

          {/* Payment gateway selector */}
          <div className="max-w-md mx-auto w-full bg-[#121212]/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-3.5 shadow-xl">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider text-center">
              {t('choose_gateway')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                disabled={!gateways.momo?.enabled}
                onClick={() => setSelectedGateway('momo')}
                className={`py-3.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedGateway === 'momo' ? 'bg-[#A50064] text-white shadow-lg shadow-[#A50064]/20' : 'bg-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm select-none">qr_code_scanner</span>
                {t('momo_wallet').split(' ')[0]}
              </button>
              <button 
                disabled={!gateways.vnpay?.enabled}
                onClick={() => setSelectedGateway('vnpay')}
                className={`py-3.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedGateway === 'vnpay' ? 'bg-[#005BAA] text-white shadow-lg shadow-[#005BAA]/20' : 'bg-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm select-none">account_balance_wallet</span>
                {t('vnpay_gateway')}
              </button>
              <button 
                disabled={!gateways.stripe?.enabled}
                onClick={() => setSelectedGateway('stripe')}
                className={`py-3.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedGateway === 'stripe' ? 'bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/20' : 'bg-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm select-none">credit_card</span>
                Card
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('loading_plans')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto">
              
              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch font-inter">
                
                {/* Free Plan Card */}
                <div className="bg-[#121212]/40 rounded-[2rem] p-8 flex flex-col justify-between border border-white/5 hover:translate-y-[-4px] hover:border-white/10 transition-all duration-300">
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-1">{t(freePlan.name)}</h3>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">{t(freePlan.description)}</p>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-3xl font-extrabold text-white">0đ</span>
                      <span className="text-xs text-on-surface-variant font-medium">/{t('vnd_per_month').split(' / ')[1]}</span>
                    </div>

                    <ul className="space-y-4">
                      {freePlan.features.map((feat, i) => (
                        <li key={i} className={`flex items-center gap-3 text-xs ${i >= 2 ? 'text-on-surface-variant/40' : ''}`}>
                          <span className="material-symbols-outlined text-base select-none">
                            {i >= 2 ? 'block' : 'check_circle'}
                          </span>
                          <span className={`font-semibold ${i < 2 ? 'text-white' : ''}`}>{t(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    disabled={user?.premium_status !== 'PREMIUM'}
                    onClick={() => handleSubscribe(freePlan)}
                    className="w-full mt-10 py-3.5 rounded-full font-bold text-xs border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
                  >
                    {user?.premium_status !== 'PREMIUM' ? t('current_plan') : t('use_free')}
                  </button>
                </div>

                {/* Premium Plan Card */}
                <div className="bg-gradient-to-b from-[#1c1c1c] to-[#121212] rounded-[2rem] p-8 flex flex-col justify-between border-2 border-primary/30 relative overflow-hidden hover:translate-y-[-4px] hover:border-primary/50 transition-all duration-300 shadow-2xl">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary blur-[64px] opacity-15 pointer-events-none"></div>
                  
                  <div>
                    <div className="mb-6 relative z-10">
                      <h3 className="text-xl font-extrabold text-white mb-1">{t(premiumPlan.name)}</h3>
                      <p className="text-[10px] text-primary uppercase tracking-widest font-extrabold">{t(premiumPlan.description)}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-8 relative z-10">
                      <span className="text-4xl font-extrabold text-white">
                        {premiumPlan.price ? (premiumPlan.price).toLocaleString('vi-VN') + 'đ' : '59.000đ'}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">/{t('vnd_per_month').split(' / ')[1]}</span>
                    </div>

                    <ul className="space-y-4 relative z-10">
                      {premiumPlan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs">
                          <span className="material-symbols-outlined text-primary text-base select-none">check_circle</span>
                          <span className="text-white font-bold">{t(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSubscribe(premiumPlan)}
                    className="w-full mt-10 py-3.5 rounded-full font-extrabold text-xs bg-primary text-black shadow-lg shadow-primary/20 hover:scale-102 transition-all select-none relative z-10 cursor-pointer"
                  >
                    {user?.premium_status === 'PREMIUM' ? t('current_plan') : t('upgrade_now_btn')}
                  </button>
                </div>

              </div>

              {/* Feature Comparison Table */}
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-lg font-bold text-center text-white mb-6">{t('feature_comparison')}</h4>
                <div className="bg-[#121212]/40 rounded-2xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                        <th className="p-4 uppercase tracking-wider">{t('feature')}</th>
                        <th className="p-4 text-center uppercase tracking-wider">{t('default_plan')}</th>
                        <th className="p-4 text-center text-primary uppercase tracking-wider">Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white">
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold">{t('Thư viện nhạc bản quyền')}</td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-primary text-sm select-none">check</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-primary text-sm select-none">check</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold">{t('Nghe nhạc không quảng cáo')}</td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-sm select-none">close</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-primary text-sm select-none">check</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold">{t('Chất lượng âm thanh')}</td>
                        <td className="p-4 text-center text-on-surface-variant font-semibold">128kbps</td>
                        <td className="p-4 text-center text-primary font-bold">320kbps / Lossless</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold">{t('Tải về nghe Offline')}</td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-sm select-none">close</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="material-symbols-outlined text-primary text-sm select-none">check</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive FAQ Section */}
              <div className="pt-6 border-t border-white/5 mb-12">
                <h4 className="text-lg font-bold text-white mb-6">{t('faq_title')}</h4>
                <div className="space-y-3">
                  
                  {/* FAQ 1 */}
                  <div className="bg-[#121212]/40 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                      className="w-full p-4 flex justify-between items-center text-left font-bold text-xs text-white hover:text-primary transition select-none cursor-pointer"
                    >
                      <span>{t('faq_cancel_anytime_q')}</span>
                      <span className={`material-symbols-outlined text-base select-none transition-transform duration-300 ${
                        openFaq === 0 ? 'rotate-180 text-primary' : ''
                      }`}>
                        expand_more
                      </span>
                    </button>
                    <div className={`transition-all duration-300 overflow-hidden ${
                      openFaq === 0 ? 'max-h-[120px] border-t border-white/5' : 'max-h-0'
                    }`}>
                      <p className="p-4 text-xs text-on-surface-variant leading-relaxed font-medium">
                        {t('faq_cancel_anytime_a')}
                      </p>
                    </div>
                  </div>

                  {/* FAQ 2 */}
                  <div className="bg-[#121212]/40 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                      className="w-full p-4 flex justify-between items-center text-left font-bold text-xs text-white hover:text-primary transition select-none cursor-pointer"
                    >
                      <span>{t('faq_how_to_pay_q')}</span>
                      <span className={`material-symbols-outlined text-base select-none transition-transform duration-300 ${
                        openFaq === 1 ? 'rotate-180 text-primary' : ''
                      }`}>
                        expand_more
                      </span>
                    </button>
                    <div className={`transition-all duration-300 overflow-hidden ${
                      openFaq === 1 ? 'max-h-[120px] border-t border-white/5' : 'max-h-0'
                    }`}>
                      <p className="p-4 text-xs text-on-surface-variant leading-relaxed font-medium">
                        {t('faq_how_to_pay_a')}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
