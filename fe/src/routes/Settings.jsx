import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function Settings() {
  const { user, updateProfileState, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'security', 'subscription'

  // Account tab states
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Update profile handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileSuccess(false);

    try {
      const updated = await api.put('/auth/me', { name, avatarUrl });
      updateProfileState(updated);
      setProfileSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoadingPassword(true);
    try {
      await api.put('/auth/me', { password: currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Cập nhật mật khẩu thất bại.');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Tất cả dữ liệu của bạn sẽ bị xóa và không thể khôi phục.');
    if (!confirmDelete) return;

    try {
      await api.delete('/auth/me');
      alert('Tài khoản của bạn đã được xóa thành công.');
      logout();
      navigate('/auth');
    } catch (err) {
      alert('Xóa tài khoản thất bại: ' + err.message);
    }
  };

  // Cancel Premium handler
  const handleCancelPremium = () => {
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy gói Premium? Các đặc quyền của bạn vẫn sẽ hoạt động cho đến cuối chu kỳ thanh toán hiện tại.');
    if (confirmCancel) {
      alert('Yêu cầu hủy gói Premium của bạn đã được tiếp nhận thành công.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Main Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Multi-Pane Layout next to main Sidebar */}
        <div className="md:ml-sidebar-width flex-1 flex flex-col md:flex-row min-w-0 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* Settings Sub-sidebar (Left Pane) */}
          <div className="w-full md:w-64 bg-surface-container-lowest flex flex-col py-6 px-4 border-b md:border-b-0 md:border-r border-white/5 shrink-0">
            <div className="px-4 mb-6 hidden md:block">
              <h2 className="text-lg font-bold text-white">{t('account_settings')}</h2>
              <p className="text-[10px] text-on-surface-variant mt-1">Manage your experience</p>
            </div>
            
            <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0">
              <button 
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === 'account' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                    : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>Account</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === 'security' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                    : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">security</span>
                <span>Security</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('subscription')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  activeTab === 'subscription' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                    : 'text-on-surface-variant hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                <span>Subscription</span>
              </button>
            </nav>

            {/* Premium Upgrade Promotion Widget at the bottom */}
            {user?.premium_status === 'FREE' && (
              <div className="mt-auto hidden md:block glass-panel p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Level Up</p>
                <p className="text-xs font-bold text-white mb-3">Melodies Premium</p>
                <button 
                  onClick={() => navigate('/subscription-plans')}
                  className="bg-electric-gradient text-white text-[10px] font-bold w-full py-2 rounded-xl active:scale-95 transition-transform cursor-pointer shadow-lg shadow-primary-container/20"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          {/* Settings Tab Panel Content (Right Pane) */}
          <main className="flex-1 p-8 overflow-y-auto min-w-0">
            <div className="max-w-3xl">

              {/* 1. Account Section */}
              {activeTab === 'account' && (
                <div className="animate-fade-in flex flex-col gap-6">
                  <div>
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">Account Information</h1>
                    <p className="text-xs text-on-surface-variant mt-1">Update your public profile and personal details.</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6 shadow-xl">
                    {profileSuccess && (
                      <div className="bg-status-success/15 border border-status-success/30 text-status-success px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>{t('profile_updated')}</span>
                      </div>
                    )}

                    {/* Avatar Display Section */}
                    <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-secondary-container flex items-center justify-center font-bold text-3xl">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{name || 'Alex Nguyen'}</h3>
                        <p className="text-[10px] text-on-surface-variant mt-1">Joined Melodies in 2024</p>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('fullname')}</label>
                        <input 
                          type="text" 
                          required
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('email_disabled')}</label>
                        <input 
                          type="email" 
                          disabled 
                          value={user?.email || ''} 
                          className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-on-surface-variant/40 cursor-not-allowed" 
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('avatar_url')}</label>
                        <input 
                          type="text" 
                          placeholder={t('avatar_url_placeholder')}
                          value={avatarUrl} 
                          onChange={e => setAvatarUrl(e.target.value)} 
                          className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <button 
                        type="submit" 
                        disabled={loadingProfile}
                        className="bg-electric-gradient text-white text-xs font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(46,91,255,0.4)] transition-all active:scale-95 cursor-pointer"
                      >
                        {loadingProfile ? (
                          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        ) : (
                          t('save_changes')
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Security Section */}
              {activeTab === 'security' && (
                <div className="animate-fade-in flex flex-col gap-6">
                  <div>
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">Security</h1>
                    <p className="text-xs text-on-surface-variant mt-1">Keep your account safe and manage password credentials.</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-5 shadow-xl">
                    <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Update Password</h3>
                    
                    {passwordSuccess && (
                      <div className="bg-status-success/15 border border-status-success/30 text-status-success px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Mật khẩu đã được cập nhật thành công!</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="bg-error/15 border border-error/30 text-error px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">warning</span>
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('current_password')}</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('new_password')}</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('confirm_new_password')}</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                      />
                    </div>

                    <div className="flex justify-start mt-2">
                      <button 
                        type="submit" 
                        disabled={loadingPassword}
                        className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-6 py-3 rounded-xl transition active:scale-95 cursor-pointer"
                      >
                        {loadingPassword ? (
                          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        ) : (
                          t('update_password')
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Danger Zone */}
                  <div className="p-6 bg-error-container/10 border border-error/20 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                    <div>
                      <h4 className="text-sm font-bold text-error">{t('danger_zone')}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{t('delete_account_desc')}</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="text-error font-bold border border-error/30 px-5 py-2.5 rounded-xl hover:bg-error/10 transition-all cursor-pointer text-xs"
                    >
                      {t('delete_account')}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Subscription Section */}
              {activeTab === 'subscription' && (
                <div className="animate-fade-in flex flex-col gap-6">
                  <div>
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">Subscription & Payment</h1>
                    <p className="text-xs text-on-surface-variant mt-1">Manage your premium plan and payment configurations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Current Active Plan Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-electric-gradient blur-[80px] opacity-20 pointer-events-none"></div>
                      
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-3 ${
                          user?.premium_status === 'PREMIUM' 
                            ? 'bg-status-success/20 text-status-success' 
                            : 'bg-white/10 text-on-surface-variant'
                        }`}>
                          {user?.premium_status === 'PREMIUM' ? t('active') : t('inactive')}
                        </span>
                        
                        <h3 className="text-lg font-extrabold text-electric-gradient mb-1">
                          {user?.premium_status === 'PREMIUM' ? 'Melodies Premium' : 'Melodies Free'}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {user?.premium_status === 'PREMIUM' 
                            ? 'Monthly Premium Plan — 59,000 VND / month' 
                            : 'Ad-supported streaming session plan.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 mt-4">
                        {user?.premium_status === 'PREMIUM' && (
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                            <span>Next billing date</span>
                            <span className="text-white font-semibold">March 12, 2024</span>
                          </div>
                        )}
                        
                        {user?.premium_status === 'PREMIUM' ? (
                          <button 
                            onClick={handleCancelPremium}
                            className="text-on-surface-variant hover:text-error text-xs font-bold py-2.5 border border-white/10 rounded-xl transition-all cursor-pointer"
                          >
                            {t('cancel_premium')}
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate('/subscription-plans')}
                            className="bg-electric-gradient text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:scale-102 cursor-pointer text-center"
                          >
                            {t('upgrade_now')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payment Gateways / Methods */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-xl">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">{t('payment_methods')}</h3>
                      
                      <div className="flex flex-col gap-2.5">
                        {/* MoMo Card */}
                        <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#A50064] flex items-center justify-center font-bold text-white text-xs shrink-0">MoMo</div>
                            <div>
                              <p className="text-xs font-bold text-white">MoMo Wallet</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">090****567</p>
                            </div>
                          </div>
                          <span className="text-[9px] uppercase font-bold text-status-success">Linked</span>
                        </div>

                        {/* VNPAY Card */}
                        <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 opacity-55">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#005BAA] flex items-center justify-center font-bold text-white text-[10px] shrink-0">VNPAY</div>
                            <div>
                              <p className="text-xs font-bold text-white">VNPAY QR</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">Unlinked</p>
                            </div>
                          </div>
                          <button className="text-tertiary font-bold text-[10px] uppercase hover:underline">Link</button>
                        </div>
                      </div>

                      <button className="w-full border-2 border-dashed border-white/10 hover:border-white/20 text-on-surface-variant hover:text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs">
                        <span className="material-symbols-outlined text-sm">add</span>
                        {t('add_payment_method')}
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>

      <MusicPlayer />
    </div>
  );
}
