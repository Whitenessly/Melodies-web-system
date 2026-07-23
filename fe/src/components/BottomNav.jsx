import React from 'react';
import { Link, useLocation } from 'react-router';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#0c0c0c]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-around px-2 md:hidden select-none">
      <Link 
        to="/home" 
        className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200 ${
          isActive('/home') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/home') ? 'filled' : ''}`}>home</span>
        <span className="text-[10px] tracking-tight">{t('home')}</span>
      </Link>

      <Link 
        to="/search-results" 
        className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200 ${
          isActive('/search-results') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/search-results') ? 'filled' : ''}`}>search</span>
        <span className="text-[10px] tracking-tight">{t('search')}</span>
      </Link>

      <Link 
        to="/library-playlists" 
        className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200 ${
          isActive('/library-playlists') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/library-playlists') ? 'filled' : ''}`}>library_music</span>
        <span className="text-[10px] tracking-tight">{t('library')}</span>
      </Link>

      <Link 
        to="/settings" 
        className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200 ${
          isActive('/settings') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/settings') ? 'filled' : ''}`}>person</span>
        <span className="text-[10px] tracking-tight">{t('account') || 'Tài khoản'}</span>
      </Link>
    </nav>
  );
}
