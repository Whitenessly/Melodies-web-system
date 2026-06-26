import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';

export default function SubscriptionPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState('momo'); // 'momo', 'vnpay', 'stripe'

  const loadPlans = async () => {
    try {
      const data = await api.get('/admin/plans');
      setPlans(data);
    } catch (err) {
      console.log('Failed to fetch pricing plans:', err.message);
      // Fallback mockup matching seed
      setPlans([
        {
          planId: 'free',
          name: 'Free',
          price: 0,
          description: 'Trải nghiệm nghe nhạc trực tuyến miễn phí',
          features: ['Nghe nhạc cơ bản', 'Có chèn Audio Ads quảng cáo', 'Chất lượng tiêu chuẩn 128kbps', 'Tải DRM bị khóa']
        },
        {
          planId: 'premium',
          name: 'Premium',
          price: 59000, // 59,000 VND
          description: 'Mở khóa âm nhạc chất lượng cao đỉnh cao',
          features: ['Không quảng cáo (Ad-free)', 'Tải nhạc bản quyền DRM Offline', 'Chất lượng cao 320kbps', 'Âm thanh không nén lossless']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    if (plan.price === 0 || plan.planId === 'free') {
      alert('Tài khoản của bạn đã ở gói Miễn phí mặc định.');
      return;
    }

    try {
      const res = await api.post('/payments/create', {
        planId: plan.planId,
        gateway: selectedGateway
      });

      if (res.payment_url) {
        // Redirect to external gateway or internal sandbox confirmation page
        if (res.payment_url.startsWith('http')) {
          window.location.href = res.payment_url;
        } else {
          navigate(res.payment_url);
        }
      }
    } catch (err) {
      alert('Tạo yêu cầu thanh toán thất bại: ' + err.message);
    }
  };

  const getCardStyle = (planId) => {
    if (planId === 'premium' || planId === 'pro') {
      return 'border border-secondary-container bg-gradient-to-b from-secondary-container/10 to-surface scale-102';
    }
    return 'border border-white/5 bg-white/[0.02]';
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h1 className="font-display-lg text-3xl font-extrabold tracking-tight text-white">Nâng cấp Gói Premium của bạn</h1>
            <p className="text-xs text-on-surface-variant">
              Tự hào nâng tầm chất lượng âm nhạc vượt trội. Lựa chọn gói cước phù hợp và hỗ trợ các nghệ sĩ bạn yêu quý.
            </p>
          </div>

          {/* Payment gateway selector */}
          <div className="max-w-md mx-auto w-full glass-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider text-center">Chọn cổng kết nối thanh toán</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedGateway('momo')}
                className={`py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedGateway === 'momo' ? 'bg-[#A50064] text-white' : 'bg-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                Ví MoMo
              </button>
              <button 
                onClick={() => setSelectedGateway('vnpay')}
                className={`py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedGateway === 'vnpay' ? 'bg-[#005BAA] text-white' : 'bg-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                Cổng VNPAY
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">Tải danh sách các gói cước...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full items-start">
              {plans.map(plan => (
                <div 
                  key={plan.planId}
                  className={`p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden transition shadow-xl ${getCardStyle(plan.planId)}`}
                >
                  {/* Recommended badge */}
                  {(plan.planId === 'premium' || plan.planId === 'pro') && (
                    <span className="absolute top-4 right-4 text-[9px] font-bold electric-btn text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      Popular
                    </span>
                  )}

                  <div>
                    <h3 className="font-display-lg text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-[10px] text-on-surface-variant mt-1.5 min-h-[30px]">{plan.description || 'Trải nghiệm dịch vụ tuyệt vời'}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {plan.price === 0 ? '0' : plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">VND / Tháng</span>
                  </div>

                  <hr className="border-white/5" />

                  {/* Features list */}
                  <ul className="flex-1 flex flex-col gap-3">
                    {plan.features?.map((feat, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs">
                        <span className="material-symbols-outlined text-sm text-tertiary mt-0.5">check_circle</span>
                        <span className="text-on-surface-variant font-medium leading-normal">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      plan.price === 0 
                        ? 'bg-white/5 text-on-surface-variant hover:bg-white/10' 
                        : 'electric-btn text-white hover:scale-102 shadow-lg shadow-primary-container/20'
                    }`}
                  >
                    {plan.price === 0 ? 'Mặc định' : 'Nâng cấp ngay'}
                  </button>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
