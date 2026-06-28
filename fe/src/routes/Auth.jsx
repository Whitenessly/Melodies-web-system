import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { api } from '../utils/api.js';

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Auth Modes: 'login', 'register', 'forgot', 'otp', 'reset'
  const [authMode, setAuthMode] = useState('login');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('listener'); // 'listener', 'artist'

  // Forgot password flow states
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpReceived, setOtpReceived] = useState('');

  // Status/Feedbacks
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Main login/register submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Submit Forgot Password (Request OTP)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setOtpReceived(res.otp || '');
      setSuccessMsg("OTP code sent successfully!" + (res.otp ? ` (OTP: ${res.otp})` : ''));
      setTimeout(() => {
        setAuthMode('otp');
        setError('');
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to request OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email: forgotEmail, otp: otpCode });
      setSuccessMsg('OTP verified successfully!');
      setTimeout(() => {
        setAuthMode('reset');
        setError('');
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        email: forgotEmail, 
        otp: otpCode, 
        newPassword 
      });
      setSuccessMsg('Password reset successfully! Redirecting...');
      setTimeout(() => {
        setAuthMode('login');
        setEmail(forgotEmail);
        setPassword('');
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setError('');
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-secondary-container/10 blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-tertiary-container/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Toast Notification Container */}
      {successMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3.5 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-fade-in transition-all">
          <div className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center text-status-success shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </div>
          <p className="text-xs font-semibold text-white">{successMsg}</p>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 shadow-2xl border border-white/5 flex flex-col gap-6 transition-all duration-300">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex flex-col items-center gap-3 justify-center">
            <Logo className="w-16 h-16 animate-pulse drop-shadow-xl" />
            <h1 className="font-display-lg text-3xl font-extrabold tracking-tight text-white mt-1">Melodies</h1>
          </div>
          <p className="text-xs text-on-surface-variant">Your Premium Music streaming companion</p>
        </div>

        {/* ==================== A. LOGIN & REGISTER MODE ==================== */}
        {(authMode === 'login' || authMode === 'register') && (
          <>
            {/* Tab triggers */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${authMode === 'login' ? 'bg-white/10 text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${authMode === 'register' ? 'bg-white/10 text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
              >
                Register
              </button>
            </div>

            {/* Error notification */}
            {error && (
              <div className="bg-error-container/20 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {authMode === 'register' && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">person</span>
                    <input 
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
                  <input 
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
                
                {authMode === 'login' && (
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthMode('forgot');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-on-surface-variant hover:text-white hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {authMode === 'register' && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Account Role</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition select-none">
                      <input 
                        type="radio" 
                        name="role" 
                        value="listener" 
                        checked={role === 'listener'}
                        onChange={() => setRole('listener')}
                        className="accent-secondary-container"
                      />
                      <span className="text-xs font-semibold text-white">Listener</span>
                    </label>
                    <label className="flex-1 flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition select-none">
                      <input 
                        type="radio" 
                        name="role" 
                        value="artist" 
                        checked={role === 'artist'}
                        onChange={() => setRole('artist')}
                        className="accent-secondary-container"
                      />
                      <span className="text-xs font-semibold text-white">Artist</span>
                    </label>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl electric-btn text-white font-bold text-sm hover:scale-102 transition cursor-pointer mt-2 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                ) : (
                  authMode === 'login' ? "Log In" : "Register"
                )}
              </button>
            </form>
          </>
        )}

        {/* ==================== B. FORGOT PASSWORD MODE (STEP 1) ==================== */}
        {authMode === 'forgot' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Forgot Password</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                Enter your email address to receive a recovery code.
              </p>
            </div>

            {error && (
              <div className="bg-error-container/20 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-electric-gradient text-white font-bold text-sm hover:scale-102 transition cursor-pointer mt-2 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-white transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back to Log In</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== C. VERIFY OTP MODE (STEP 2) ==================== */}
        {authMode === 'otp' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Verify OTP</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                Enter the 6-digit OTP code sent to your email.
              </p>
            </div>

            {/* Sandbox Helper display */}
            {otpReceived && (
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center text-xs">
                <span className="text-on-surface-variant">Sandbox Testing OTP: </span>
                <span className="text-tertiary font-bold text-sm tracking-widest">{otpReceived}</span>
              </div>
            )}

            {error && (
              <div className="bg-error-container/20 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleOtpVerifySubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">OTP Code</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">vpn_key</span>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition text-center tracking-widest font-mono font-bold"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-electric-gradient text-white font-bold text-sm hover:scale-102 transition cursor-pointer mt-2 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => {
                  setAuthMode('forgot');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-white transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== D. RESET PASSWORD MODE (STEP 3) ==================== */}
        {authMode === 'reset' && (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Reset Password</h2>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                Enter a new password for your account.
              </p>
            </div>

            {error && (
              <div className="bg-error-container/20 border border-status-error/30 text-status-error px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">New Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-electric-gradient text-white font-bold text-sm hover:scale-102 transition cursor-pointer mt-2 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setForgotEmail('');
                  setOtpCode('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setSuccessMsg('');
                }}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-white transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Back to Log In</span>
              </button>
            </div>
          </div>
        )}

        {/* Visual Decorative Detail */}
        <div className="flex justify-center items-end h-8 gap-0.5 mt-2">
          <div className="w-[3px] bg-secondary animate-[bar-dance_1.2s_infinite_ease-in-out]" style={{ animationDelay: '0.1s' }} />
          <div className="w-[3px] bg-tertiary animate-[bar-dance_1.2s_infinite_ease-in-out]" style={{ animationDelay: '0.3s' }} />
          <div className="w-[3px] bg-secondary animate-[bar-dance_1.2s_infinite_ease-in-out]" style={{ animationDelay: '0.5s' }} />
          <div className="w-[3px] bg-tertiary animate-[bar-dance_1.2s_infinite_ease-in-out]" style={{ animationDelay: '0.7s' }} />
        </div>

      </div>
    </div>
  );
}
