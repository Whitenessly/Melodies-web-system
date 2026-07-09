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
  const [receivedOtp, setReceivedOtp] = useState('');
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

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  // Change Email Handlers
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setLoadingEmailStep(true);
    setEmailStepError('');

    try {
      const res = await api.post('/auth/change-email-request', { newEmail });
      if (res.otp) {
        setReceivedOtp(res.otp);
      }
      setLoadingEmailStep(false);
      setEmailStep(2);
      startResendTimer();
    } catch (err) {
      setLoadingEmailStep(false);
      setEmailStepError(err.message);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setLoadingEmailStep(true);
    setEmailStepError('');

    const code = verificationCode.join('');
    if (code.length < 6) {
      setEmailStepError(t('verify_otp_desc'));
      setLoadingEmailStep(false);
      return;
    }

    try {
      const res = await api.post('/auth/change-email-verify', {
        newEmail,
        otp: code
      });
      updateProfileState(res.user);
      setLoadingEmailStep(false);
      setEmailStep(3);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      setLoadingEmailStep(false);
      setEmailStepError(err.message);
    }
  };

  const handleResendOtp = async () => {
    setEmailStepError('');
    try {
      const res = await api.post('/auth/change-email-request', { newEmail });
      if (res.otp) {
        setReceivedOtp(res.otp);
      }
      startResendTimer();
    } catch (err) {
      setEmailStepError(err.message);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && verificationCode[index] === '' && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Security Tab Handlers
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordSuccess(false);
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('err_password_mismatch') || 'Mật khẩu xác nhận không khớp.');
      setLoadingPassword(false);
      return;
    }

    try {
      await api.put('/auth/me/password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await api.delete('/auth/me');
      logout();
      setShowDeleteModal(false);
      navigate('/auth');
    } catch (err) {
      setDeleteError(err.message || 'Không thể xóa tài khoản lúc này.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Cancel Subscription Plan handler
  const handleCancelPremium = async () => {
    const confirmCancel = window.confirm(t('confirm_cancel_premium') || 'Bạn có chắc chắn muốn hủy gia hạn tự động gói Premium?');
    if (!confirmCancel) return;

    try {
      const updatedUser = await api.post('/auth/me/cancel-subscription');
      updateProfileState(updatedUser);
      alert(t('msg_cancel_premium_success') || 'Đã hủy tự động gia hạn thành công. Gói Premium của bạn vẫn hoạt động đến ngày hết hạn.');
    } catch (err) {
      alert(t('payment_failed') + err.message);
    }
  };

  // Reactivate Premium handler
  const handleReactivatePremium = async () => {
    try {
      const updatedUser = await api.post('/auth/me/reactivate-subscription');
      updateProfileState(updatedUser);
      alert(t('msg_reactivate_premium_success') || 'Đã kích hoạt lại tự động gia hạn gói Premium thành công!');
    } catch (err) {
      alert(t('payment_failed') + err.message);
    }
  };

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (activeTab === 'subscription') {
      const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
          const res = await api.get('/payments/history');
          if (Array.isArray(res)) {
            setTransactions(res);
          }
        } catch (err) {
          console.error('Failed to fetch transactions:', err);
        } finally {
          setLoadingTransactions(false);
        }
      };
      fetchTransactions();
    }
  }, [activeTab]);

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
              <p className="text-[10px] text-on-surface-variant mt-1">{t('manage_experience')}</p>
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
                <span>{t('account_info').split(' ')[0]}{t('account_info').split(' ')[1]?.toLowerCase() === 'tin' ? ' tin' : ''}</span>
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
                <span>{t('security')}</span>
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
                <span>{t('billing_and_plans').split(' & ')[0]}</span>
              </button>
            </nav>

            {/* Premium Upgrade Promotion Widget at the bottom */}
            {user?.premium_status === 'FREE' && (
              <div className="mt-auto hidden md:block bg-[#121212]/40 border border-white/5 p-4 rounded-2xl">
                <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Level Up</p>
                <p className="text-xs font-bold text-white mb-3">Melodies Premium</p>
                <button 
                  onClick={() => navigate('/subscription-plans')}
                  className="bg-primary text-black text-[10px] font-extrabold w-full py-2.5 rounded-full hover:scale-105 active:scale-95 transition cursor-pointer shadow-lg"
                >
                  {t('upgrade_to_premium_badge')}
                </button>
              </div>
            )}
          </div>

          {/* Settings Tab Panel Content (Right Pane) */}
          <main className="flex-1 p-8 pb-32 overflow-y-auto min-w-0">
            <div className="max-w-3xl">

              {/* 1. Account Section */}
              {activeTab === 'account' && (
                <div className="animate-fade-in flex flex-col gap-6">
                  <div>
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">{t('account_info')}</h1>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">{t('update_profile_desc')}</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-6 shadow-xl">
                    {profileSuccess && (
                      <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>{t('profile_updated')}</span>
                      </div>
                    )}

                    {/* Avatar Display Section */}
                    <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-[4px] border-zinc-800 bg-zinc-800 flex items-center justify-center font-bold text-3xl shadow-md">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start">
                        <h3 className="text-sm font-bold text-white">{name || 'Alex Nguyen'}</h3>
                        <p className="text-[10px] text-on-surface-variant mt-1 font-medium">{t('joined_date')}</p>
                        
                        {!avatarUploading ? (
                          <div className="flex items-center gap-3">
                            <label className="border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-bold px-5 py-2 mt-3 cursor-pointer transition select-none flex items-center justify-center w-fit shadow-md">
                              {t('change_photo')}
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
                                className="border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-full text-xs font-bold px-5 py-2 mt-3 cursor-pointer transition select-none flex items-center justify-center w-fit shadow-md"
                              >
                                {t('remove')}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-48 flex flex-col gap-1 mt-3">
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono font-bold">
                              <span>{t('uploading')}</span>
                              <span>{avatarUploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-100" 
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
                          className="w-full h-11 px-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('email_disabled')}</label>
                        <div className="relative flex items-center">
                          <input 
                            type="email" 
                            disabled 
                            value={user?.email || ''} 
                            className="w-full h-11 pl-4 pr-24 bg-[#121212] border border-white/5 rounded-xl text-xs text-on-surface-variant/40 cursor-not-allowed font-medium" 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setShowEmailModal(true);
                              setEmailStep(1);
                              setNewEmail('');
                              setVerificationCode(['', '', '', '', '', '']);
                              setReceivedOtp('');
                              setEmailStepError('');
                            }}
                            className="absolute right-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-bold cursor-pointer transition select-none border border-white/10"
                          >
                            {t('change')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <button 
                        type="submit" 
                        disabled={loadingProfile}
                        className="bg-primary text-black text-xs font-extrabold px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition duration-200 cursor-pointer shadow-lg disabled:opacity-50"
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
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">{t('security')}</h1>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                      {t('security_desc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column (Main Form) */}
                    <form onSubmit={handleChangePassword} className="lg:col-span-2 bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-5 shadow-xl">
                      {passwordSuccess && (
                        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>{t('password_updated_success')}</span>
                        </div>
                      )}

                      {passwordError && (
                        <div className="bg-red-500/10 border border-red-500/25 text-red-500 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
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
                            className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{t('new_password')}</label>
                          {newPassword && (
                            <span className={`text-[9px] font-bold tracking-wider ${
                              newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                                ? 'text-primary' 
                                : newPassword.length >= 6 
                                ? 'text-amber-500' 
                                : 'text-red-500'
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
                            placeholder={t('new_password_placeholder')}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-10 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
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
                            placeholder={t('confirm_password_placeholder')}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
                          />
                        </div>
                      </div>

                      <div className="flex justify-start mt-2">
                        <button 
                          type="submit" 
                          disabled={loadingPassword}
                          className="bg-primary text-black text-xs font-extrabold px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition duration-200 cursor-pointer w-fit shadow-lg disabled:opacity-50"
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
                      <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('password_requirements')}</h3>
                        <ul className="flex flex-col gap-3 text-xs text-white">
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              newPassword.length >= 8 ? 'text-primary' : 'text-on-surface-variant/40'
                            }`}>
                              {newPassword.length >= 8 ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={newPassword.length >= 8 ? 'text-white' : 'text-on-surface-variant font-medium'}>
                              {t('req_min_chars')}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              /[A-Z]/.test(newPassword) ? 'text-primary' : 'text-on-surface-variant/40'
                            }`}>
                              {/[A-Z]/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={/[A-Z]/.test(newPassword) ? 'text-white' : 'text-on-surface-variant font-medium'}>
                              {t('req_uppercase')}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-primary' : 'text-on-surface-variant/40'
                            }`}>
                              {/[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={/[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-white' : 'text-on-surface-variant font-medium'}>
                              {t('req_number_symbol')}
                            </span>
                          </li>
                          <li className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 select-none ${
                              confirmPassword && newPassword === confirmPassword ? 'text-primary' : 'text-on-surface-variant/40'
                            }`}>
                              {confirmPassword && newPassword === confirmPassword ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={confirmPassword && newPassword === confirmPassword ? 'text-white' : 'text-on-surface-variant font-medium'}>
                              {t('req_match')}
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* Pro Tip Card */}
                      <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex gap-4 shadow-xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary"></div>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                          <span className="material-symbols-outlined text-primary text-lg">shield</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-white">{t('pro_tip')}</h4>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                            {t('2fa_tip_desc')}
                          </p>
                          <button 
                            type="button" 
                            className="text-primary hover:text-white font-bold text-[10px] mt-1 cursor-pointer flex items-center gap-1 self-start"
                          >
                            <span>{t('configure_2fa')}</span>
                            <span className="material-symbols-outlined text-[10px] font-bold">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                    <div>
                      <h4 className="text-sm font-bold text-red-500">{t('danger_zone')}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 font-medium">{t('delete_account_desc')}</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="text-red-500 font-extrabold border border-red-500/30 px-5 py-2.5 rounded-full hover:bg-red-500/10 transition-all cursor-pointer text-xs"
                    >
                      {t('delete_account')}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Subscription Section */}
              {activeTab === 'subscription' && (
                <div className="animate-fade-in flex flex-col gap-8">
                  {/* Title & Description */}
                  <div>
                    <h1 className="font-display-lg text-2xl font-extrabold text-white">{t('billing_and_plans')}</h1>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">{t('billing_subtitle')}</p>
                  </div>

                  {/* Top Row: Plan details & Active method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Current Active Plan Card */}
                    <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                      
                      <div>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-3 ${
                          user?.premium_status === 'PREMIUM' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-white/10 text-on-surface-variant'
                        }`}>
                          {user?.premium_status === 'PREMIUM' ? t('active') : t('inactive')}
                        </span>
                        
                        <h3 className="text-lg font-extrabold text-white mb-1">
                          {user?.premium_status === 'PREMIUM' ? 'Melodies Premium' : 'Melodies Free'}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                          {user?.premium_status === 'PREMIUM' 
                            ? t('premium_monthly_desc') 
                            : t('free_plan_desc')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 mt-4">
                        {user?.premium_status === 'PREMIUM' && user?.premium_expired_at && (
                          <div className="text-[10px] text-on-surface-variant flex flex-col gap-1.5 font-medium">
                            {user?.premium_auto_renew === false ? (
                              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 leading-normal text-left">
                                <span className="material-symbols-outlined text-xs mr-1 select-none font-bold">warning</span>
                                {t('premium_cancelled_notice').replace('{date}', new Date(user.premium_expired_at).toLocaleDateString('vi-VN'))}
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <span>{t('next_billing_date')}</span>
                                <span className="text-white font-semibold">{new Date(user.premium_expired_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {user?.premium_status === 'PREMIUM' ? (
                          user?.premium_auto_renew === false ? (
                            <button 
                              onClick={handleReactivatePremium}
                              className="bg-primary text-black text-xs font-extrabold py-2.5 rounded-full transition-all hover:scale-105 cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-lg"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">autorenew</span>
                              {t('reactivate_renew')}
                            </button>
                          ) : (
                            <button 
                              onClick={handleCancelPremium}
                              className="text-on-surface-variant hover:text-red-500 text-xs font-bold py-2.5 border border-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">cancel</span>
                              {t('cancel_premium')}
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={() => navigate('/subscription-plans')}
                            className="bg-primary text-black text-xs font-extrabold py-2.5 rounded-full transition-all hover:scale-105 cursor-pointer text-center"
                          >
                            {t('upgrade_now')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Payment Method */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('current_method')}</h3>
                        {user?.premium_status === 'PREMIUM' && (
                          <span className="text-status-success text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            {t('verified')}
                          </span>
                        )}
                      </div>

                      {user?.premium_status === 'PREMIUM' ? (() => {
                        const defaultMethod = user?.paymentMethods?.find(pm => pm.isDefault);
                        if (defaultMethod) {
                          const brandUpper = defaultMethod.brand ? defaultMethod.brand.toUpperCase() : 'CARD';
                          const brandDisplay = brandUpper === 'MASTERCARD' ? 'MC' : brandUpper;
                          return (
                            <div className="flex items-center gap-4 py-3">
                              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shrink-0 font-bold text-white text-xs select-none uppercase">
                                {brandDisplay}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">Thẻ {brandUpper}</h4>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">Chủ thẻ: {defaultMethod.cardholderName ? defaultMethod.cardholderName.toUpperCase() : ''}</p>
                                <p className="text-xs text-white font-mono mt-1 font-semibold">•••• •••• •••• {defaultMethod.last4}</p>
                              </div>
                            </div>
                          );
                        }
                        // Fallback to default MoMo if no card payment method is found
                        return (
                          <div className="flex items-center gap-4 py-3">
                            <div className="w-12 h-12 bg-[#A50064] rounded-xl flex items-center justify-center shadow-lg shrink-0 font-bold text-white text-sm select-none">
                              MoMo
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">Ví MoMo</h4>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">{t('last_linked_prefix')} {t('12 Th08, 2023')}</p>
                              <p className="text-xs text-white font-mono mt-1 font-semibold">098****321</p>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="py-4 text-center">
                          <p className="text-xs text-on-surface-variant">{t('no_payment_method')}</p>
                        </div>
                      )}

                      <div className="flex gap-2.5 mt-2">
                        {user?.premium_status === 'PREMIUM' ? (
                          <>
                            <button 
                              onClick={() => alert(t('payment_method_removed'))}
                              className="flex-1 py-2 rounded-xl border border-white/10 text-on-surface-variant hover:text-white transition cursor-pointer text-[10px] font-bold"
                            >
                              {t('remove')}
                            </button>
                            <button 
                              onClick={() => navigate('/subscription-plans')}
                              className="flex-1 py-2 rounded-xl bg-white text-background hover:bg-white/90 transition cursor-pointer text-[10px] font-bold"
                            >
                              {t('change')}
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => navigate('/subscription-plans')}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition cursor-pointer text-[10px] font-bold"
                          >
                            {t('setup_payment')}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Add New Methods (Temporarily hidden) */}
                  {false && (
                    <div className="flex flex-col gap-4">
                      <h2 className="text-sm font-bold text-white">{t('add_new_method')}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* VNPAY Card */}
                        <div 
                          onClick={() => navigate('/subscription-plans')}
                          className="glass-panel p-5 rounded-2xl cursor-pointer hover:scale-102 transition duration-300 flex flex-col justify-between min-h-[160px]"
                        >
                          <div>
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden mb-3">
                              <img 
                                className="w-7 h-auto" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY9ZpD0ymz5mgXX4fMiZV68-WhyDv6aSJmsx2QJH2UK8DW9S8_Vg177MXGdZYY_u67Ej7ScWN4i_pcJmtbraIxHOA80jmbvwQCyoi8Z49rIdZMYXkUuK_Om2xiKPeFknAwBBBBQDOjNTArrIUwldX2rDHxjeylal7BIBXBoRt56idmD0FsUdfmi53oaE5Ac4bIG9DTfuExxKeL1JrGOBU92cO-7knD2BvmBarovS_nsII2nowAwx_wWWx-xGDNa0QU_ipcZSJD3A" 
                                alt="VNPAY" 
                              />
                            </div>
                            <h4 className="text-xs font-bold text-white">{t('vnpay_gateway')}</h4>
                            <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">{t('vnpay_desc')}</p>
                          </div>
                          <div className="text-secondary-container text-[10px] font-bold flex items-center gap-1 mt-3">
                            {t('connect_now')}
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </div>
                        </div>

                        {/* Credit Card */}
                        <div 
                          onClick={() => navigate('/subscription-plans')}
                          className="glass-panel p-5 rounded-2xl cursor-pointer hover:scale-102 transition duration-300 flex flex-col justify-between min-h-[160px]"
                        >
                          <div>
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-3">
                              <span className="material-symbols-outlined text-secondary-container">credit_card</span>
                            </div>
                            <h4 className="text-xs font-bold text-white">{t('credit_card')}</h4>
                            <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">{t('credit_card_desc')}</p>
                          </div>
                          <div className="text-secondary-container text-[10px] font-bold flex items-center gap-1 mt-3">
                            {t('add_card')}
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </div>
                        </div>

                        {/* Other Methods */}
                        <div 
                          onClick={() => navigate('/subscription-plans')}
                          className="glass-panel p-5 rounded-2xl border-dashed border-white/20 hover:border-white/40 cursor-pointer transition flex flex-col justify-center items-center text-center min-h-[160px]"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mb-2.5">
                            <span className="material-symbols-outlined text-on-surface-variant">add</span>
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('other_methods')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white">{t('transaction_history')}</h2>
                      <button 
                        onClick={() => alert(t('loading_invoices'))}
                        className="text-[10px] text-on-surface-variant hover:text-white underline font-semibold"
                      >
                        {t('download_invoice')}
                      </button>
                    </div>

                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                            <th className="p-3.5">{t('table_desc')}</th>
                            <th className="p-3.5">{t('table_date')}</th>
                            <th className="p-3.5">{t('table_amount')}</th>
                            <th className="p-3.5 text-right">{t('table_status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {loadingTransactions ? (
                            <tr>
                              <td colSpan="4" className="p-6 text-center text-on-surface-variant text-xs">
                                Đang tải lịch sử giao dịch...
                              </td>
                            </tr>
                          ) : transactions.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="p-6 text-center text-on-surface-variant text-xs">
                                Chưa có giao dịch nào được thực hiện.
                              </td>
                            </tr>
                          ) : (
                            transactions.map((tx) => {
                              const isSuccess = tx.status === 'SUCCESS';
                              const formattedDate = new Date(tx.completed_at || tx.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                              const formattedAmount = tx.amount ? tx.amount.toLocaleString('vi-VN') + 'đ' : '0đ';
                              
                              return (
                                <tr key={tx._id} className="hover:bg-white/[0.01]">
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                                        isSuccess ? 'bg-status-success/15' : 'bg-status-error/15'
                                      }`}>
                                        <span className={`material-symbols-outlined text-base ${
                                          isSuccess ? 'text-status-success' : 'text-status-error'
                                        }`}>
                                          {isSuccess ? 'workspace_premium' : 'error'}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-white">Gói Premium Cá nhân (1 Tháng)</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-on-surface-variant font-mono">{formattedDate}</td>
                                  <td className="p-3.5 text-white font-bold font-mono">{formattedAmount}</td>
                                  <td className="p-3.5 text-right">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      isSuccess ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'
                                    }`}>
                                      {isSuccess ? t('success') : t('failed')}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="p-6 rounded-2xl bg-electric-gradient/10 border border-secondary/20 flex flex-col md:flex-row items-center gap-6 mt-2">
                    <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0 border border-secondary-container/30">
                      <span className="material-symbols-outlined text-secondary-container text-2xl">help_center</span>
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h4 className="text-sm font-bold text-white">{t('need_help')}</h4>
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">{t('help_desc')}</p>
                    </div>
                    <button 
                      onClick={() => alert('Đang kết nối với hỗ trợ...')}
                      className="px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 transition font-bold text-xs cursor-pointer"
                    >
                      {t('contact_now')}
                    </button>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-[#121212]/90 w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-5 text-center relative">
            
            {/* Step 1: Thay đổi Email */}
            {emailStep === 1 && (
              <form onSubmit={handleRequestEmailChange} className="flex flex-col gap-4">
                {/* Logo & Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center text-primary">
                    <Logo className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{t('change_email')}</h3>
                  <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed font-medium">
                    {t('enter_new_email_desc')}
                  </p>
                </div>

                {emailStepError && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-500 px-3 py-2 rounded-xl text-[10px] text-left">
                    {emailStepError}
                  </div>
                )}

                {/* Input with Mail Icon */}
                <div className="flex flex-col gap-1 text-left mt-2">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant ml-1">{t('new_email_label')}</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-sm select-none">mail</span>
                    <input 
                      type="email" 
                      required 
                      placeholder="example@email.com" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loadingEmailStep}
                  className="w-full h-11 bg-primary text-black text-xs font-extrabold rounded-full hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer mt-3 disabled:opacity-50"
                >
                  {loadingEmailStep ? t('sending_code') : t('send_verification_code')}
                </button>

                {/* Cancel link */}
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="text-xs text-on-surface-variant hover:text-white transition cursor-pointer select-none font-bold mt-1"
                >
                  {t('btn_cancel')}
                </button>
              </form>
            )}

            {/* Step 2: Xác thực Email mới */}
            {emailStep === 2 && (
              <form onSubmit={handleVerifyEmailChange} className="flex flex-col gap-4">
                {/* Logo & Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-xl text-primary font-bold">mail</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{t('verify_new_email')}</h3>
                  <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed font-medium">
                    {t('otp_sent_new_email_desc')}
                  </p>
                  {receivedOtp && (
                    <div className="mt-3 bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-2 text-xs font-mono select-all flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="material-symbols-outlined text-sm font-bold">key</span>
                      <span>[Sandbox OTP]: <strong className="text-white tracking-wider">{receivedOtp}</strong></span>
                    </div>
                  )}
                </div>

                {emailStepError && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-500 px-3 py-2 rounded-xl text-[10px] text-left">
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
                      className="w-10 h-12 text-center bg-[#121212] border border-white/10 rounded-xl text-base font-bold text-white focus:border-primary focus:bg-white/5 transition"
                      ref={(el) => (otpRefs.current[i] = el)}
                    />
                  ))}
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loadingEmailStep}
                  className="w-full h-11 bg-primary text-black text-xs font-extrabold rounded-full hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loadingEmailStep ? t('confirming') : t('confirm_change')}
                </button>

                {/* Resend status */}
                <div className="text-xs text-on-surface-variant mt-2 select-none font-medium">
                  <span>{t('no_code_received')} </span>
                  {resendTimer > 0 ? (
                    <span className="text-primary font-bold">{t('resend_code')} ({resendTimer}s)</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-primary hover:text-white font-extrabold cursor-pointer transition"
                    >
                      {t('resend_code')}
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
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary shadow-lg">
                    <span className="material-symbols-outlined text-2xl font-bold">check</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">{t('email_change_success')}</h3>
                  <p className="text-xs text-on-surface-variant max-w-[270px] mx-auto leading-relaxed font-medium">
                    {t('email_updated_notice')}
                  </p>
                </div>

                {/* Confirm button */}
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="w-full h-11 bg-primary text-black text-xs font-extrabold rounded-full hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer mt-4"
                >
                  {t('back_to_profile')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Delete Account Modal Overlay */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-[#121212]/90 w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-5 text-center relative animate-scale-in">
            <button 
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-on-surface-variant hover:text-white transition cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-lg font-bold">close</span>
            </button>

            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 self-center mt-2">
              <span className="material-symbols-outlined text-2xl font-bold">warning</span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-white">Xóa tài khoản vĩnh viễn?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                Hành động này không thể hoàn tác. Tất cả dữ liệu cá nhân, danh sách phát đã thích và lịch sử nghe nhạc của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-xl text-[10px] text-left">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <button 
                type="button" 
                disabled={deletingAccount}
                onClick={confirmDeleteAccount}
                className="w-full h-11 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full active:scale-98 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingAccount ? (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                ) : (
                  'Tôi hiểu, hãy xóa tài khoản'
                )}
              </button>
              <button 
                type="button"
                disabled={deletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="w-full h-11 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-full active:scale-98 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
