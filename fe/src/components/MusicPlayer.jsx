import React, { useRef } from 'react';
import { useNavigate } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    shuffle, 
    repeat, 
    togglePlay, 
    next, 
    prev, 
    seek, 
    changeVolume, 
    toggleShuffle, 
    toggleRepeat 
  } = usePlayer();

  const { user, toggleLikeSong } = useAuth();
  const progressBarRef = useRef(null);

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

  // If no song is loaded, render a disabled player bar (so the layout is still intact but inactive)
  if (!currentSong) {
    return (
      <footer className="fixed bottom-6 left-6 right-6 h-[96px] z-50 flex items-center px-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-white/10 justify-between shadow-2xl rounded-3xl">
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant/50">
            <span className="material-symbols-outlined">music_note</span>
          </div>
          <div>
            <h5 className="text-label-md font-label-md text-on-surface-variant">Không có bài hát</h5>
            <p className="text-label-sm font-label-sm text-on-surface-variant/50">Chọn nhạc để phát</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-6 opacity-50 pointer-events-none">
            <span className="material-symbols-outlined">shuffle</span>
            <span className="material-symbols-outlined">skip_previous</span>
            <button className="w-10 h-10 rounded-full bg-white text-background flex items-center justify-center">
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
            <span className="material-symbols-outlined">skip_next</span>
            <span className="material-symbols-outlined">repeat</span>
          </div>
          <div className="w-full flex items-center gap-3 opacity-50 pointer-events-none">
            <span className="text-label-sm font-label-sm text-on-surface-variant">0:00</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full"></div>
            <span className="text-label-sm font-label-sm text-on-surface-variant">0:00</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/4">
          <div className="flex items-center gap-2 w-32 opacity-50 pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant">volume_up</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </footer>
    );
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const thumbnailSrc = currentSong.thumbnailUrl.startsWith('http') 
    ? currentSong.thumbnailUrl 
    : `http://localhost:8080${currentSong.thumbnailUrl}`;

  return (
    <footer className="fixed bottom-6 left-6 right-6 h-[96px] z-50 flex items-center px-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-white/10 justify-between shadow-2xl rounded-3xl">
      {/* Song details */}
      <div className="flex items-center gap-4 w-1/4">
        <div 
          onClick={() => navigate('/player')}
          className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/5 cursor-pointer hover:scale-105 transition-transform"
        >
          <img className="w-full h-full object-cover" src={thumbnailSrc} alt={currentSong.title} />
        </div>
        <div className="hidden sm:block overflow-hidden max-w-[150px]">
          <h5 
            onClick={() => navigate('/player')}
            className="text-label-md font-label-md text-white truncate cursor-pointer hover:text-primary transition-colors"
          >
            {currentSong.title}
          </h5>
          <p 
            onClick={() => {
              if (currentSong.artistId) navigate(`/artist-detail?id=${currentSong.artistId}`);
            }}
            className="text-label-sm font-label-sm text-on-surface-variant truncate cursor-pointer hover:text-primary transition-colors"
          >
            {currentSong.artist}
          </p>
        </div>
        <button 
          onClick={handleLikeToggle}
          className={`ml-2 transition-colors cursor-pointer ${isLiked ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
      </div>

      {/* Center Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleShuffle}
            className={`transition-colors cursor-pointer ${shuffle ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          <button 
            onClick={prev}
            className="text-white hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">skip_previous</span>
          </button>
          <button 
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button 
            onClick={next}
            className="text-white hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">skip_next</span>
          </button>
          <button 
            onClick={toggleRepeat}
            className={`transition-colors cursor-pointer ${repeat !== 'none' ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
          >
            <span className="material-symbols-outlined">
              {repeat === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        {/* Progress scrub bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-label-sm font-label-sm text-on-surface-variant w-10 text-right">{formatTime(currentTime)}</span>
          <div 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer"
          >
            <div 
              style={{ width: `${progressPercent}%` }}
              className="absolute top-0 left-0 h-full bg-primary rounded-full group-hover:bg-secondary transition-colors"
            ></div>
            <div 
              style={{ left: `${progressPercent}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            ></div>
          </div>
          <span className="text-label-sm font-label-sm text-on-surface-variant w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls (volume & lyrics link) */}
      <div className="flex items-center justify-end gap-4 w-1/4">
        <button 
          onClick={() => navigate('/player')}
          className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors cursor-pointer hidden md:block"
        >
          lyrics
        </button>
        
        {/* Volume bar */}
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

        <button 
          onClick={() => navigate('/player')}
          className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors cursor-pointer"
        >
          open_in_full
        </button>
      </div>
    </footer>
  );
};

export default MusicPlayer;
