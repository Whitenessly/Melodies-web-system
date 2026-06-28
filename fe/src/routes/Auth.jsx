import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Auth() {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('listener'); // 'listener', 'artist'
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginTab) {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-secondary-container/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-tertiary-container/10 blur-[150px]" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 shadow-2xl border border-white/5 flex flex-col gap-6">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3 justify-center">
            <Logo className="w-12 h-12 animate-pulse" />
            <h1 className="font-display-lg text-3xl font-extrabold tracking-tight text-white">Melodies</h1>
          </div>
          <p className="text-xs text-on-surface-variant">Your Premium Music streaming companion</p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            type="button"
            onClick={() => { setIsLoginTab(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${isLoginTab ? 'bg-white/10 text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
          >
            {t('login')}
          </button>
          <button 
            type="button"
            onClick={() => { setIsLoginTab(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${!isLoginTab ? 'bg-white/10 text-white shadow' : 'text-on-surface-variant hover:text-white'}`}
          >
            {t('register')}
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
          
          {!isLoginTab && (
            <div className="flex flex-col gap-1.5">
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
          </div>

          {!isLoginTab && (
            <div className="flex flex-col gap-1.5">
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
              isLoginTab ? t('login') : t('register')
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
