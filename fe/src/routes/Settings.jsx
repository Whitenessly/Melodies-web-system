import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import Logo from '../components/Logo.jsx';
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

  // Avatar upload states
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState('');

  // Email change states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState(1); // 1 = request, 2 = verify, 3 = success
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(59);
  const [emailStepError, setEmailStepError] = useState('');
  const [loadingEmailStep, setLoadingEmailStep] = useState(false);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFileName(file.name);
    setAvatarUploading(true);
    setAvatarUploadProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setAvatarUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setAvatarUploading(false);
          setAvatarUrl(reader.result);
        }
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(59);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailStepError('');
    setLoadingEmailStep(true);

    try {
      await api.post('/auth/change-email-request', { newEmail });
      setEmailStep(2);
      setVerificationCode(['', '', '', '', '', '']);
      startResendTimer();
    } catch (err) {
      setEmailStepError(err.message || 'Gửi mã xác thực thất bại.');
    } finally {
      setLoadingEmailStep(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setEmailStepError('');
    setLoadingEmailStep(true);

    const otp = verificationCode.join('');
    if (otp.length < 6) {
      setEmailStepError('Vui lòng nhập đủ 6 chữ số.');
      setLoadingEmailStep(false);
      return;
    }

    try {
      const res = await api.post('/auth/change-email-verify', { newEmail, otp });
      if (res.success) {
        updateProfileState(res.user);
        setEmailStep(3);
      }
    } catch (err) {
      setEmailStepError(err.message || 'Xác thực OTP thất bại.');
    } finally {
      setLoadingEmailStep(false);
    }
  };

  const handleResendOtp = async () => {
    setEmailStepError('');
    try {
      await api.post('/auth/change-email-request', { newEmail });
      startResendTimer();
    } catch (err) {
      setEmailStepError(err.message || 'Gửi lại mã OTP thất bại.');
    }
  };

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu phải dài ít nhất 8 ký tự.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Mật khẩu phải chứa ít nhất một chữ cái in hoa.');
      return;
    }
    if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError('Mật khẩu phải chứa ít nhất một chữ số hoặc ký tự đặc biệt.');
      return;
    }
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
                        <div className="w-24 h-24 rounded-full overflow-hidden border-[4px] border-[#2A2A2A] bg-secondary-container flex items-center justify-center font-bold text-3xl shadow-md">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start">
                        <h3 className="text-sm font-bold text-white">{name || 'Alex Nguyen'}</h3>
                        <p className="text-[10px] text-on-surface-variant mt-1">Joined Melodies in 2024</p>
                        
                        {!avatarUploading ? (
                          <div className="flex items-center gap-3">
                            <label className="border border-white/20 hover:border-white/40 bg-[#1E1E1E] hover:bg-white/5 text-white rounded-full text-xs font-bold px-6 py-2.5 mt-3 cursor-pointer transition select-none flex items-center justify-center w-fit shadow-md">
                              Change Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleAvatarFileChange} 
                                className="hidden" 
                              />
                            </label>
                            {avatarUrl && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setAvatarUrl('');
                                  setAvatarFileName('');
                                }}
                                className="border border-error/20 hover:border-error/40 bg-error/5 hover:bg-error/10 text-error rounded-full text-xs font-bold px-6 py-2.5 mt-3 cursor-pointer transition select-none flex items-center justify-center w-fit shadow-md"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-48 flex flex-col gap-1 mt-3">
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                              <span>Uploading...</span>
                              <span>{avatarUploadProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-electric-gradient transition-all duration-100" 
                                style={{ width: `${avatarUploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
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
                        <div className="relative flex items-center">
                          <input 
                            type="email" 
                            disabled 
                            value={user?.email || ''} 
                            className="w-full h-11 pl-4 pr-24 bg-white/5 border border-white/5 rounded-xl text-xs text-on-surface-variant/40 cursor-not-allowed" 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setShowEmailModal(true);
                              setEmailStep(1);
                              setNewEmail('');
                              setVerificationCode(['', '', '', '', '', '']);
                              setEmailStepError('');
                            }}
                            className="absolute right-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-[10px] font-bold cursor-pointer transition select-none"
                          >
                            Thay đổi
                          </button>
                        </div>
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
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                      Keep your Melodies account secure. We recommend using a unique password that you don't use on other services.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column (Main Form) */}
                    <form onSubmit={handleChangePassword} className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-5 shadow-xl">
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
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-sm select-none">lock</span>
                          <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{t('new_password')}</label>
                          {newPassword && (
                            <span className={`text-[9px] font-bold tracking-wider ${
                              newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                                ? 'text-status-success' 
                                : newPassword.length >= 6 
                                ? 'text-status-warning' 
                                : 'text-error'
                            }`}>
                              STRENGTH: {
                                newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                                  ? 'STRONG'
                                  : newPassword.length >= 6
                                  ? 'MEDIUM'
                                  : 'WEAK'
                              }
                            </span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-sm select-none">vpn_key</span>
                          <input 
                            type={showNewPassword ? 'text' : 'password'} 
                            required
                            placeholder="New password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 text-on-surface-variant hover:text-white transition cursor-pointer select-none flex items-center"
                          >
                            <span className="material-symbols-outlined text-base">
                              {showNewPassword ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('confirm_new_password')}</label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-sm select-none">lock</span>
                          <input 
                            type="password" 
                            required
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 focus:bg-white/10 transition" 
                          />
                        </div>
                      </div>

                      <div className="flex justify-start mt-2">
                        <button 
                          type="submit" 
                          disabled={loadingPassword}
                          className="bg-electric-gradient text-white text-xs font-bold px-8 py-3.5 rounded-full hover:shadow-[0_0_25px_rgba(46,91,255,0.5)] transition-all active:scale-95 cursor-pointer w-fit"
                        >
                          {loadingPassword ? (
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                          ) : (
                            t('update_password')
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Right Column (Requirements & Tips) */}
                    <div className="flex flex-col gap-6">
                      {/* Password Requirements Card */}
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 shadow-xl">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Password Requirements</h3>
                        <ul className="flex flex-col gap-3 text-xs text-white">
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              newPassword.length >= 8 ? 'text-status-success' : 'text-on-surface-variant/40'
                            }`}>
                              {newPassword.length >= 8 ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={newPassword.length >= 8 ? 'text-white' : 'text-on-surface-variant'}>
                              8+ characters minimum
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              /[A-Z]/.test(newPassword) ? 'text-status-success' : 'text-on-surface-variant/40'
                            }`}>
                              {/[A-Z]/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={/[A-Z]/.test(newPassword) ? 'text-white' : 'text-on-surface-variant'}>
                              At least one uppercase letter
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-status-success' : 'text-on-surface-variant/40'
                            }`}>
                              {/[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={/[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-white' : 'text-on-surface-variant'}>
                              At least one number or symbol
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              confirmPassword && newPassword === confirmPassword ? 'text-status-success' : 'text-on-surface-variant/40'
                            }`}>
                              {confirmPassword && newPassword === confirmPassword ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={confirmPassword && newPassword === confirmPassword ? 'text-white' : 'text-on-surface-variant'}>
                              Matches confirmation field
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* Pro Tip Card */}
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-4 shadow-xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#2E5BFF]"></div>
                        <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-full flex items-center justify-center shrink-0 border border-[#2E5BFF]/20">
                          <span className="material-symbols-outlined text-[#2E5BFF] text-lg">shield</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-white">Pro Tip</h4>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed">
                            Consider enabling Two-Factor Authentication (2FA) for an extra layer of security beyond your password.
                          </p>
                          <button 
                            type="button" 
                            className="text-secondary-container hover:text-white font-bold text-[10px] mt-1 cursor-pointer flex items-center gap-1 self-start"
                          >
                            <span>Configure 2FA</span>
                            <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

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

      {/* Change Email Modal Overlay */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-5 text-center relative">
            
            {/* Step 1: Thay đổi Email */}
            {emailStep === 1 && (
              <form onSubmit={handleRequestEmailChange} className="flex flex-col gap-4">
                {/* Logo & Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Logo className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">Thay đổi Email</h3>
                  <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">
                    Nhập địa chỉ email mới mà bạn muốn sử dụng cho tài khoản Melodies.
                  </p>
                </div>

                {emailStepError && (
                  <div className="bg-error/10 border border-error/20 text-error px-3 py-2 rounded-xl text-[10px] text-left">
                    {emailStepError}
                  </div>
                )}

                {/* Input with Mail Icon */}
                <div className="flex flex-col gap-1 text-left mt-2">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">Email mới</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-sm select-none">mail</span>
                    <input 
                      type="email" 
                      required 
                      placeholder="example@email.com" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white focus:border-white/10 transition" 
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loadingEmailStep}
                  className="w-full h-11 bg-electric-gradient text-white text-xs font-bold rounded-xl active:scale-98 transition shadow-lg cursor-pointer mt-3"
                >
                  {loadingEmailStep ? 'Đang gửi...' : 'Gửi mã xác thực'}
                </button>

                {/* Cancel link */}
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="text-xs text-on-surface-variant hover:text-white transition cursor-pointer select-none font-bold mt-1"
                >
                  Hủy bỏ
                </button>
              </form>
            )}

            {/* Step 2: Xác thực Email mới */}
            {emailStep === 2 && (
              <form onSubmit={handleVerifyEmailChange} className="flex flex-col gap-4">
                {/* Logo & Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-xl text-secondary-container">mail</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">Xác thực Email mới</h3>
                  <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">
                    Chúng tôi đã gửi mã xác thực 6 chữ số đến email mới của bạn. Vui lòng nhập mã bên dưới.
                  </p>
                </div>

                {emailStepError && (
                  <div className="bg-error/10 border border-error/20 text-error px-3 py-2 rounded-xl text-[10px] text-left">
                    {emailStepError}
                  </div>
                )}

                {/* OTP Digits Container */}
                <div className="flex gap-2 justify-center my-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={verificationCode[i] || ''}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className="w-10 h-12 text-center bg-white/5 border border-white/10 rounded-xl text-base font-bold text-white focus:border-secondary-container focus:bg-white/10 transition"
                      ref={(el) => (otpRefs.current[i] = el)}
                    />
                  ))}
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loadingEmailStep}
                  className="w-full h-11 bg-electric-gradient text-white text-xs font-bold rounded-xl active:scale-98 transition shadow-lg cursor-pointer mt-2"
                >
                  {loadingEmailStep ? 'Đang xác nhận...' : 'Xác nhận thay đổi'}
                </button>

                {/* Resend status */}
                <div className="text-xs text-on-surface-variant mt-2 select-none">
                  <span>Không nhận được mã? </span>
                  {resendTimer > 0 ? (
                    <span className="text-secondary-container font-semibold">Gửi lại mã ({resendTimer}s)</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-secondary-container hover:text-white font-bold cursor-pointer transition"
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step 3: Cập nhật Email thành công */}
            {emailStep === 3 && (
              <div className="flex flex-col gap-4 py-2">
                {/* Success Icon */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined text-2xl">check</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">Thay đổi Email thành công!</h3>
                  <p className="text-xs text-on-surface-variant max-w-[270px] mx-auto leading-relaxed">
                    Địa chỉ email của bạn đã được cập nhật. Bạn sẽ cần sử dụng email mới này để đăng nhập vào lần sau.
                  </p>
                </div>

                {/* Confirm button */}
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="w-full h-11 bg-electric-gradient text-white text-xs font-bold rounded-xl active:scale-98 transition shadow-lg cursor-pointer mt-4"
                >
                  Quay lại Hồ sơ
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
