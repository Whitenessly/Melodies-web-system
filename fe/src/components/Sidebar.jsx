import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import Logo from './Logo.jsx';

import BottomNav from './BottomNav.jsx';

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
    <>
      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Desktop Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-[280px] bg-[#040404] border-r border-white/5 hidden md:flex flex-col px-6 pt-6 ${playerHeightPadding} z-30 transition-all duration-300`}>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={() => navigate('/home')}>
          <div className="w-10 h-10 flex items-center justify-center transition duration-300 group-hover:scale-105">
            <Logo className="w-10 h-10" />
          </div>
          <span className="font-display-lg text-2xl font-extrabold tracking-tight text-white group-hover:text-primary transition duration-300">Melodies</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2">
          <Link 
            to="/home" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/home') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/home') ? 'filled text-primary' : ''}`}>home</span>
            <span>{t('home')}</span>
          </Link>

          <Link 
            to="/search-results" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/search-results') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/search-results') ? 'filled text-primary' : ''}`}>search</span>
            <span>{t('search')}</span>
          </Link>

          <Link 
            to="/library-playlists" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/library-playlists') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/library-playlists') ? 'filled text-primary' : ''}`}>library_music</span>
            <span>{t('library')}</span>
          </Link>

          <Link 
            to="/notifications-social" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
              isActive('/notifications-social') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive('/notifications-social') ? 'filled text-primary' : ''}`}>notifications</span>
            <span>{t('notifications')}</span>
          </Link>

          {/* Separator */}
          <hr className="border-white/5 my-4" />

          {/* Role-based navigation */}
          {(user?.role === 'artist' || user?.role === 'admin') && (
            <Link 
              to="/artist-dashboard" 
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
                isActive('/artist-dashboard') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/artist-dashboard') ? 'filled text-primary' : ''}`}>record_voice_over</span>
              <span>{t('artist_dashboard')}</span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link 
              to="/admin-dashboard" 
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
                isActive('/admin-dashboard') ? 'bg-white/10 text-white font-bold' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/admin-dashboard') ? 'filled text-primary' : ''}`}>admin_panel_settings</span>
              <span>{t('admin_dashboard')}</span>
            </Link>
          )}
        </nav>

        {/* User profile & Language selector */}
        <div className="flex flex-col gap-4 mt-auto">
          {/* Language switch */}
          <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-xs text-on-surface-variant font-semibold ml-2">Language</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setLanguage('en')}
                 className={`text-xs px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer ${language === 'en' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('vi')}
                 className={`text-xs px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer ${language === 'vi' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-white'}`}
              >
                VI
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
