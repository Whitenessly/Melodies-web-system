import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

export default function Settings() {
  const { user, updateProfileState } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const updated = await api.put('/auth/me', { name, avatarUrl });
      updateProfileState(updated);
      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8 max-w-2xl mx-auto w-full">
          <div>
            <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">settings</span>
              Thiết lập Tài khoản
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Cập nhật thông tin định danh và quản lý các giao dịch nâng cấp Premium.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-5 shadow-xl">
            {success && (
              <div className="bg-status-success/15 border border-status-success/30 text-status-success px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Thông tin tài khoản đã được cập nhật thành công!</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Email (Không thể thay đổi)</label>
              <input 
                type="email" 
                disabled 
                value={user?.email || ''} 
                className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-on-surface-variant/40 cursor-not-allowed" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Họ và Tên</label>
              <input 
                type="text" 
                required
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Ảnh đại diện (URL)</label>
              <input 
                type="text" 
                placeholder="Nhập đường dẫn URL hình ảnh..."
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
                className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1 font-semibold">Giao dịch mua hàng</label>
              <button 
                type="button"
                onClick={() => navigate('/payment-history')}
                className="w-max px-4 py-2 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                Xem Lịch sử Giao dịch
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 rounded-xl electric-btn text-white font-bold text-xs hover:scale-102 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </form>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
