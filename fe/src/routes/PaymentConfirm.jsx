import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

export default function PaymentConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useAuth();

  const [orderId, setOrderId] = useState('');
  const [gateway, setGateway] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const order = params.get('orderId');
    const gate = params.get('gateway');
    const stat = params.get('status') || 'PENDING';
    
    if (order) setOrderId(order);
    if (gate) setGateway(gate);
    if (stat) setStatus(stat);
  }, [location.search]);

  const handleVerifyPayment = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/payments/verify', {
        orderId,
        gateway,
        status: 'SUCCESS'
      });
      
      setStatus('SUCCESS');
      setMessage(res.message || 'Thanh toán thành công! Gói cước của bạn đã được nâng cấp.');
      
      // Refresh Auth Context User state to premium immediately
      await fetchProfile();
    } catch (err) {
      setMessage(err.message || 'Xác thực thanh toán thất bại.');
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
                {status === 'SUCCESS' ? 'Đã Thanh toán thành công' : 'Đang chờ Thanh toán'}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Mô phỏng Giao dịch thông qua Cổng {gateway ? gateway.toUpperCase() : 'Momo/VNPay'} Sandbox
              </p>
            </div>

            {/* Invoice parameters */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left text-xs flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Mã Đơn hàng:</span>
                <span className="font-mono font-bold text-white">{orderId || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phương thức:</span>
                <span className="font-bold text-white capitalize">{gateway || 'Ví Điện Tử'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Số tiền:</span>
                <span className="font-bold text-tertiary">59.000 VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Thời hạn gói:</span>
                <span className="font-bold text-white">30 ngày (Kể từ khi kích hoạt)</span>
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
                  Quét mã QR bằng ứng dụng MoMo/VNPay giả lập hoặc click nút bên dưới để hoàn tất giao dịch.
                </p>
              </div>
            )}

            {/* Notification message */}
            {message && (
              <p className={`text-xs font-semibold ${status === 'SUCCESS' ? 'text-status-success' : 'text-status-error'}`}>
                {message}
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
                    'Xác nhận đã chuyển khoản thành công'
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/home')}
                  className="w-full h-11 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition cursor-pointer"
                >
                  Bắt đầu nghe nhạc Premium
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
