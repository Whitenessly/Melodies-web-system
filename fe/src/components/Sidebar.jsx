import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import Logo from './Logo.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currentSong, isAdPlaying } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  const hasActivePlayer = !!(currentSong || isAdPlaying);
  const playerHeightPadding = hasActivePlayer 
    ? (user?.premium_status === 'FREE' ? 'pb-[140px]' : 'pb-[116px]') 
    : 'pb-6';

  return (
    <aside className={`fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-white/5 flex flex-col px-6 pt-6 ${playerHeightPadding} z-30 transition-all duration-300`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/home')}>
        <Logo className="w-9 h-9" />
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

      </div>
    </aside>
  );
}
