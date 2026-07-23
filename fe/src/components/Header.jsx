import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { api } from '../utils/api.js';

export default function Header() {
  const { user, fetchProfile, updateProfileState, logout } = useAuth();
  const { t } = useLanguage();
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [instantResults, setInstantResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // User dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);
  const userMenuRef = useRef(null);

  // Parse q from URL search params on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [location.search]);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.log('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll notifications every 30s
      const timer = setInterval(loadNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, [user]);

  // Debounced search logic (400ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setInstantResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await api.get(`/songs?isApproved=true&q=${encodeURIComponent(searchQuery)}`);
        // If query returns normal array or fuzzy object
        const songs = Array.isArray(data) ? data : (data.songs || []);
        setInstantResults(songs.slice(0, 5)); // show top 5 instant results
      } catch (err) {
        console.error('Instant search error:', err.message);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleInstantClick = (song) => {
    setShowSearchDropdown(false);
    playSong(song, [song], 0);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log(err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      await api.post(`/notifications/${notif._id}/read`);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (notif.link) {
        navigate(notif.link);
      }
      setShowNotificationDropdown(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <header className="sticky top-0 h-16 md:h-20 bg-[#070707]/75 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:pl-[312px] md:pr-8 z-20 gap-2 md:gap-6">
      {/* Search Input */}
      <form ref={searchContainerRef} onSubmit={handleSearchSubmit} className="relative flex-1 max-w-[380px] group">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-hover:text-white transition duration-200 text-lg md:text-xl">search</span>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => {
              setShowSearchDropdown(true);
              if (user) {
                fetchProfile();
              }
            }}
            className="w-full h-9 md:h-11 pl-9 md:pl-12 pr-3 md:pr-4 bg-[#121212] border border-white/5 rounded-full text-xs md:text-sm text-white placeholder-on-surface-variant focus:border-primary focus:bg-[#181818] focus:ring-1 focus:ring-primary transition duration-200"
          />
        </div>

        {/* Instant Search Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div className="absolute top-11 md:top-13 left-0 w-full glass-panel rounded-2xl p-2 shadow-2xl z-50 border border-white/10 mt-1">
            {instantResults.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {instantResults.map(song => (
                  <div
                    key={song._id}
                    onClick={() => handleInstantClick(song)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition duration-150"
                  >
                    <img
                      src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{song.title}</p>
                      <p className="text-xs text-on-surface-variant truncate">{song.artist}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary hover:scale-105 transition">play_circle</span>
                  </div>
                ))}
                <button
                  type="submit"
                  className="text-xs text-center py-2.5 text-primary hover:underline cursor-pointer border-t border-white/5 mt-1.5 pt-2 font-bold transition duration-150"
                >
                  Xem tất cả kết quả cho "{searchQuery}"
                </button>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant p-4 text-center">Không tìm thấy kết quả phù hợp</p>
            )}
          </div>
        )}

        {/* Recent Search Dropdown */}
        {showSearchDropdown && !searchQuery.trim() && user && user.searchHistory && user.searchHistory.length > 0 && (
          <div className="absolute top-11 md:top-13 left-0 w-full glass-panel rounded-2xl p-2 shadow-2xl z-50 border border-white/10 mt-1">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Tìm kiếm gần đây</span>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    updateProfileState({ searchHistory: [] });
                    await api.delete('/auth/me/clear-search-history');
                  } catch (err) {
                    console.log('Failed to clear search history:', err.message);
                  }
                }}
                className="text-[10px] text-error hover:underline font-bold cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 mt-1">
              {user.searchHistory.map((queryText, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchQuery(queryText);
                    setShowSearchDropdown(false);
                    navigate(`/search-results?q=${encodeURIComponent(queryText)}`);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs text-on-surface-variant hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">history</span>
                    <span className="truncate font-semibold">{queryText}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const updatedHistory = user.searchHistory.filter(h => h !== queryText);
                        updateProfileState({ searchHistory: updatedHistory });
                        await api.put('/auth/me/remove-search-query', { query: queryText });
                      } catch (err) {
                        console.log('Failed to remove search query:', err.message);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        {/* Upgrade Premium CTA for Free account, or Premium Badge for Premium account */}
        {user?.premium_status === 'FREE' ? (
          <button
            onClick={() => navigate('/subscription-plans')}
            className="bg-white hover:bg-zinc-200 text-black text-[11px] md:text-xs font-bold px-3 py-1.5 md:px-6 md:py-2.5 rounded-full hover:scale-105 transition duration-200 cursor-pointer shadow-lg whitespace-nowrap"
          >
            {t('btn_upgrade_premium')}
          </button>
        ) : (
          <div
            onClick={() => navigate('/settings?tab=subscription')}
            className="border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white text-[11px] md:text-xs font-bold px-3 py-1.5 md:px-5 md:py-2.5 rounded-full flex items-center gap-1 md:gap-1.5 cursor-pointer transition duration-200"
          >
            <span className="material-symbols-outlined text-xs md:text-sm text-primary filled">stars</span>
            <span className="hidden xs:inline">Premium</span>
          </div>
        )}

        {/* Notifications Dropdown Container */}
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={() => {
              setShowNotificationDropdown(!showNotificationDropdown);
              loadNotifications();
            }}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#121212] border border-white/5 flex items-center justify-center text-on-surface-variant hover:text-white transition hover:bg-white/10 hover:border-white/10 cursor-pointer relative"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-primary text-black font-extrabold text-[9px] md:text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div className="absolute right-0 top-11 md:top-12 w-[calc(100vw-32px)] max-w-xs md:w-80 glass-panel rounded-2xl p-2 shadow-2xl z-50 border border-white/10 mt-1">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-bold text-white">Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-primary hover:underline cursor-pointer font-bold"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-2">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotifClick(notif)}
                      className={`p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition flex items-start gap-2.5 ${!notif.isRead ? 'bg-white/[0.02]' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${notif.type === 'new_track' ? 'text-primary' : notif.type === 'admin' ? 'text-error' : 'text-primary'
                        }`}>
                        {notif.type === 'new_track' ? 'library_music' : notif.type === 'admin' ? 'warning' : 'info'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold text-white ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant p-4 text-center">Không có thông báo mới nào</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge Info with Dropdown */}
        <div ref={userMenuRef} className="relative">
          <div
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 md:gap-3 cursor-pointer p-1 md:p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition duration-150"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-electric-gradient flex items-center justify-center font-bold text-white text-xs md:text-sm overflow-hidden flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs font-bold text-white max-w-[120px] truncate hidden sm:inline-block">
              {user?.name}
            </span>
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 top-11 md:top-12 w-48 glass-panel rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 border border-white/10 mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/5 transition flex items-center gap-2.5 font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg text-primary">settings</span>
                {t('settings')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                  navigate('/auth');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-error hover:bg-error/10 transition flex items-center gap-2.5 font-bold cursor-pointer border-t border-white/5 mt-1 pt-1.5"
              >
                <span className="material-symbols-outlined text-lg text-error">logout</span>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
