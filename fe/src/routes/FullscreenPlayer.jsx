import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

const FullscreenPlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    shuffle, 
    repeat, 
    queue,
    queueIndex,
    togglePlay, 
    next, 
    prev, 
    seek, 
    changeVolume, 
    toggleShuffle, 
    toggleRepeat,
    play
  } = usePlayer();

  const { user, toggleLikeSong, hasUnread, logout } = useAuth();
  const progressBarRef = useRef(null);
  const activeItemRef = useRef(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
        setShowLangSubmenu(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [queueIndex]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const songId = params.get('songId');
    if (songId) {
      const loadSong = async () => {
        try {
          const res = await api.get('/songs');
          const song = res.songs?.find(s => s._id === songId);
          if (song) {
            play(song, res.songs || []);
          }
        } catch (err) {
          console.error("Failed to load song from query param:", err);
        }
      };
      Promise.resolve().then(() => loadSong());
    }
  }, [location.search, play]);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleProgressBarClick = (e) => {
    if (!duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seek(percentage * duration);
  };

  const handleVolumeBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    changeVolume(percentage);
  };

  const isLiked = user?.likedSongs && currentSong ? user.likedSongs.includes(currentSong._id) : false;

  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    if (!currentSong) return;
    try {
      await toggleLikeSong(currentSong._id);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return getFullUrl(user.avatarUrl);
    }
    return null;
  };

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface-variant gap-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[150px] rounded-full"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-primary animate-bounce">music_note</span>
          <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Chưa chọn bài hát nào")}</h2>
          <p className="text-body-md text-on-surface-variant max-w-sm text-center">
            {t("Quay lại trang chủ và nhấp vào một bài hát bất kỳ để bắt đầu thưởng thức âm nhạc.")}
          </p>
          <button 
            onClick={() => navigate('/home')}
            className="mt-4 px-6 py-3 rounded-full bg-primary text-on-primary font-bold hover:scale-105 transition-transform cursor-pointer"
          >
            {t("Quay về trang chủ")}
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const thumbnailSrc = getFullUrl(currentSong.thumbnailUrl);

  // Parse lyrics
  const lyricsLines = currentSong.lyrics 
    ? currentSong.lyrics.split('\n').filter(line => line.trim()) 
    : [];

  return (
    <div className="h-screen bg-background text-on-background relative overflow-hidden flex flex-col">
      {/* Glow background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="relative z-30 flex justify-between items-center w-full px-gutter-desktop h-16 bg-background/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="hover:bg-white/10 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-white text-xl">arrow_back_ios_new</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Melodies Player</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/notifications-social')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all scale-95 active:scale-90 cursor-pointer"
            title={t("Thông báo")}
          >
            <span className="material-symbols-outlined">notifications</span>
            {hasUnread && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
            )}
          </button>
          <span 
            onClick={() => navigate('/home')} 
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            home
          </span>
          {user && (
            <div ref={dropdownRef} className="relative">
              {/* User Avatar Clickable */}
              <div 
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowLangSubmenu(false);
                }}
                className="h-10 w-10 rounded-full overflow-hidden bg-surface-container-high border border-white/10 flex items-center justify-center text-primary font-bold cursor-pointer hover:border-primary active:scale-95 transition-all"
              >
                {getAvatarUrl() ? (
                  <img 
                    src={getAvatarUrl()} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  user.name ? user.name[0].toUpperCase() : 'U'
                )}
              </div>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-container border border-white/10 shadow-2xl py-2 z-40">
                  <div className="px-4 py-2 border-b border-white/5">
                    <p className="text-on-surface font-semibold font-bold text-label-md truncate">{user.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{user.role}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLangSubmenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    {t("Cài đặt tài khoản")}
                  </button>

                  <div className="relative">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLangSubmenu(!showLangSubmenu);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">language</span>
                        {t("Ngôn ngữ")}
                      </div>
                      <span className="material-symbols-outlined text-xs">arrow_back_ios</span>
                    </button>
                    
                    {/* Language Submenu to the left */}
                    {showLangSubmenu && (
                      <div className="absolute right-full top-0 mr-2 w-48 rounded-2xl bg-surface-container border border-white/10 shadow-2xl py-2 z-50">
                        <button
                          type="button"
                          onClick={() => {
                            if (language !== 'en') {
                              setLanguage('en');
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>English</span>
                          {language === 'en' && (
                            <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (language !== 'vi') {
                              setLanguage('vi');
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>Tiếng Việt</span>
                          {language === 'vi' && (
                            <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLangSubmenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-error/10 text-label-md text-error font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    {t("Đăng xuất")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main player layout */}
      <main className="relative z-10 flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-64px)] bg-background/20">
        
        {/* Left column: Play Queue */}
        <aside className="col-span-3 h-full max-h-full overflow-hidden border-r border-white/5 bg-surface-container-low/30 backdrop-blur-xl p-6 hidden md:flex flex-col gap-6 min-h-0">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{t("Danh sách phát")}</h3>
            <span className="text-[11px] bg-white/10 text-on-surface-variant px-2 py-0.5 rounded font-mono">
              {queueIndex + 1}/{queue.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {queue.map((song, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div 
                  key={song._id}
                  ref={isCurrent ? activeItemRef : null}
                  onClick={() => play(song, queue)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                    isCurrent ? 'bg-primary/15 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Song index indicator */}
                  <span className="text-[12px] font-mono text-on-surface-variant/60 shrink-0 w-6 text-right mr-1">
                    {idx + 1}
                  </span>

                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md">
                    <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-lg">play_arrow</span>
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <span className={`block font-label-md text-label-md truncate font-bold ${isCurrent ? 'text-primary' : 'text-white'}`}>
                      {song.title}
                    </span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant truncate">
                      {song.artist}
                    </span>
                  </div>

                  {isCurrent && isPlaying && (
                    <span className="material-symbols-outlined text-primary text-lg animate-pulse">equalizer</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center column: Album Cover and Primary Controls */}
        <section className="col-span-12 md:col-span-6 flex flex-col items-center justify-between pt-4 pb-8 px-4 md:px-8 relative h-full min-h-0 overflow-hidden bg-background/20">
          <div className="h-full flex flex-col justify-between items-center w-full max-w-[420px] py-1.5 min-h-0">
            
            {/* Visual Cover */}
            <div className="w-[32vh] sm:w-[36vh] md:w-[40vh] max-w-full aspect-square group shrink-0 relative">
              <div className="absolute inset-0 bg-primary/30 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 rounded-full"></div>
              <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 transition-transform duration-500 group-hover:scale-[1.02]">
                <img className="w-full h-full object-cover" src={thumbnailSrc} alt={currentSong.title} />
              </div>
            </div>

            {/* Song Metadata and Controls Container */}
            <div className="w-full flex-1 flex flex-col justify-between mt-4 min-h-0">
              
              {/* Song Metadata */}
              <div className="text-center">
                <h2 className="font-headline-lg text-headline-lg text-white font-bold tracking-tight mb-1 line-clamp-1">
                  {currentSong.title}
                </h2>
                <p 
                  onClick={() => {
                    if (currentSong.artistId) navigate(`/artist-detail?id=${currentSong.artistId}`);
                  }}
                  className="font-body-md text-body-md text-secondary font-medium hover:text-primary transition-colors cursor-pointer inline-block"
                >
                  {currentSong.artist}
                </p>
              </div>

              {/* Seek scrub bar */}
              <div className="flex flex-col gap-1.5">
                <div 
                  ref={progressBarRef}
                  onClick={handleProgressBarClick}
                  className="h-1.5 w-full bg-white/10 rounded-full cursor-pointer relative group"
                >
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(221,183,255,0.8)]"
                  ></div>
                  <div 
                    style={{ left: `${progressPercent}%` }}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-4 border-primary"
                  ></div>
                </div>
                
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Button Controls */}
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={toggleShuffle}
                  className={`material-symbols-outlined transition-colors cursor-pointer text-[22px] ${
                    shuffle ? 'text-primary' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  shuffle
                </button>
                <button 
                  onClick={prev}
                  className="material-symbols-outlined text-white hover:text-primary transition-all text-[30px] active:scale-90 cursor-pointer"
                >
                  skip_previous
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 bg-white text-background rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[30px] text-background" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <button 
                  onClick={next}
                  className="material-symbols-outlined text-white hover:text-primary transition-all text-[30px] active:scale-90 cursor-pointer"
                >
                  skip_next
                </button>
                <button 
                  onClick={toggleRepeat}
                  className={`material-symbols-outlined transition-colors cursor-pointer text-[22px] ${
                    repeat !== 'none' ? 'text-primary' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  {repeat === 'one' ? 'repeat_one' : 'repeat'}
                </button>
              </div>

              {/* Like / Volume Actions */}
              <div className="flex justify-between items-center px-4 pt-2 border-t border-white/5">
                <button 
                  onClick={handleLikeToggle}
                  className={`cursor-pointer transition-colors p-1 flex items-center justify-center rounded-full ${
                    isLiked ? 'text-primary' : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span 
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2 w-32 group">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">
                    {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                  </span>
                  <div 
                    onClick={handleVolumeBarClick}
                    className="flex-1 h-1 bg-white/10 rounded-full relative cursor-pointer"
                  >
                    <div 
                      style={{ width: `${volume * 100}%` }}
                      className="absolute top-0 left-0 h-full bg-on-surface-variant group-hover:bg-primary transition-colors"
                    ></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Right column: Lyrics Section */}
        <aside className="col-span-3 h-full max-h-full overflow-hidden border-l border-white/5 bg-surface-container-low/10 backdrop-blur-xl p-6 hidden lg:flex flex-col gap-6 min-h-0">
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{t("Lời bài hát")}</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-12 select-none">
            {lyricsLines.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-on-surface-variant/50 p-4">
                <div>
                  <span className="material-symbols-outlined text-4xl mb-2">lyrics</span>
                  <p className="font-label-md">{t("Không có lời bài hát cho tác phẩm này.")}</p>
                </div>
              </div>
            ) : (
              lyricsLines.map((line, idx) => (
                <p 
                  key={idx} 
                  className="font-headline-md text-body-lg text-on-surface-variant/80 hover:text-white transition-colors duration-200"
                >
                  {line}
                </p>
              ))
            )}
          </div>
        </aside>

      </main>
    </div>
  );
};

export default FullscreenPlayer;
