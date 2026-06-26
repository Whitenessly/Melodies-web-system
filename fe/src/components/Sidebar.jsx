import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-white/5 flex flex-col p-6 z-30">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/home')}>
        <span className="material-symbols-outlined text-4xl text-secondary-container">pulse</span>
        <span className="font-display-lg text-2xl font-bold tracking-tight text-white">Melodies</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        <Link 
          to="/home" 
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/home') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined filled">home</span>
          <span>{t('home')}</span>
        </Link>

        <Link 
          to="/search-results" 
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/search-results') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined">search</span>
          <span>{t('search')}</span>
        </Link>

        <Link 
          to="/library-playlists" 
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/library-playlists') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined">library_music</span>
          <span>{t('library')}</span>
        </Link>

        <Link 
          to="/notifications-social" 
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/notifications-social') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span>{t('notifications')}</span>
        </Link>

        <Link 
          to="/settings" 
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
            isActive('/settings') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span>{t('settings')}</span>
        </Link>

        {/* Separator */}
        <hr className="border-white/5 my-4" />

        {/* Role-based navigation */}
        {(user?.role === 'artist' || user?.role === 'admin') && (
          <Link 
            to="/artist-dashboard" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/artist-dashboard') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">record_voice_over</span>
            <span>{t('artist_dashboard')}</span>
          </Link>
        )}

        {user?.role === 'admin' && (
          <Link 
            to="/admin-dashboard" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/admin-dashboard') ? 'bg-white/10 text-white font-semibold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>{t('admin_dashboard')}</span>
          </Link>
        )}
      </nav>

      {/* User profile & Language selector */}
      <div className="flex flex-col gap-4 mt-auto">
        {/* Language switch */}
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
          <span className="text-xs text-on-surface-variant font-medium ml-2">Language</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setLanguage('en')}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition ${language === 'en' ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('vi')}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition ${language === 'vi' ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white'}`}
            >
              VI
            </button>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-white overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  user.premium_status === 'PREMIUM' 
                    ? 'electric-btn text-white' 
                    : 'bg-white/10 text-on-surface-variant'
                }`}>
                  {user.premium_status}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error transition p-1 rounded-lg hover:bg-white/5"
              title={t('logout')}
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
