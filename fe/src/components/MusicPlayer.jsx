import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function MusicPlayer() {
  const { user, updateProfileState } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    loopMode,
    setLoopMode,
    isShuffle,
    setIsShuffle,
    isAdPlaying,
    activeAd,
    playNext,
    playPrev,
    togglePlay,
    seek
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const loadUserPlaylists = async () => {
    try {
      const data = await api.get('/playlists/my');
      setUserPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && showAddPlaylistModal) {
      loadUserPlaylists();
    }
  }, [user, showAddPlaylistModal]);

  const handleAddSongToPlaylist = async (playlistId) => {
    if (!currentSong) return;
    try {
      await api.post(`/playlists/${playlistId}/add`, { songId: currentSong._id });
      alert('Đã thêm bài hát vào danh sách phát thành công!');
      setShowAddPlaylistModal(false);
    } catch (err) {
      alert(err.message || 'Thêm bài hát thất bại.');
    }
  };

  // Sync like state
  useEffect(() => {
    if (user && currentSong) {
      setIsLiked(user.likedSongs?.includes(currentSong._id));
    }
  }, [user, currentSong]);

  if (!currentSong && !isAdPlaying) return null;

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLikeToggle = async () => {
    if (isAdPlaying || !currentSong) return;
    try {
      if (isLiked) {
        await api.post(`/songs/${currentSong._id}/unlike`);
        const updatedLiked = user.likedSongs.filter(id => id !== currentSong._id);
        updateProfileState({ likedSongs: updatedLiked });
        setIsLiked(false);
      } else {
        await api.post(`/songs/${currentSong._id}/like`);
        const updatedLiked = [...(user.likedSongs || []), currentSong._id];
        updateProfileState({ likedSongs: updatedLiked });
        setIsLiked(true);
      }
    } catch (err) {
      console.log('Failed to toggle like status:', err.message);
    }
  };

  const handleAdClick = () => {
    if (isAdPlaying && activeAd) {
      if (activeAd.targetUrl) {
        window.open(activeAd.targetUrl, '_blank');
      }
      api.post(`/admin/ads/${activeAd._id}/click`).catch(err => {
        console.error('Failed to register ad click:', err.message);
      });
    }
  };

  const handleLoopToggle = () => {
    if (loopMode === 'none') setLoopMode('all');
    else if (loopMode === 'all') setLoopMode('single');
    else setLoopMode('none');
  };

  // Render waveform bars
  const waveformData = currentSong?.waveform_data || Array.from({ length: 80 }, () => 0.5);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`fixed bottom-0 left-0 w-full h-[112px] bg-surface/90 backdrop-blur-xl border-t border-white/5 flex flex-col justify-between px-8 py-3 shadow-2xl transition-all duration-300 ${showAddPlaylistModal ? 'z-[100]' : 'z-40'}`}>
      {/* Free User Advertisement Warning Top Bar */}
      {user?.premium_status === 'FREE' && !isAdPlaying && (
        <div className="absolute -top-6 left-0 w-full h-6 bg-gradient-to-r from-secondary-container to-primary-container flex items-center justify-between px-8">
          <p className="text-[10px] text-white font-semibold flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-xs animate-pulse">campaign</span>
            {t('free_banner')}
          </p>
          <button 
            onClick={() => navigate('/subscription-plans')}
            className="text-[9px] text-white font-bold hover:underline cursor-pointer bg-white/20 px-2 py-0.5 rounded"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Ad active top bar indicator */}
      {isAdPlaying && (
        <div className="absolute -top-6 left-0 w-full h-6 bg-error flex items-center justify-center px-8 animate-pulse">
          <p className="text-[10px] text-white font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-xs">warning</span>
            {t('playing_ad')}: {activeAd?.title || 'Quảng Cáo Tài Trợ'} ({formatTime(duration - currentTime)} còn lại)
          </p>
        </div>
      )}

      {/* Main Player Row */}
      <div className="flex-1 flex items-center justify-between gap-6">
        
        {/* Left Side: Thumbnail & Track Info */}
        <div className="flex items-center gap-4 w-[28%] min-w-[200px]">
          <div 
            onClick={isAdPlaying ? handleAdClick : () => navigate('/player')}
            className={`w-16 h-16 rounded-xl overflow-hidden bg-white/5 cursor-pointer relative group flex-shrink-0 border border-white/5 ${isAdPlaying ? 'hover:ring-2 hover:ring-secondary-container transition-all duration-200' : ''}`}
          >
            <img 
              src={isAdPlaying ? (activeAd?.imageUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100') : (currentSong?.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100')} 
              alt={isAdPlaying ? activeAd?.title : currentSong?.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {!isAdPlaying && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">open_in_full</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p 
              onClick={isAdPlaying ? handleAdClick : () => navigate('/player')}
              className="text-sm font-bold text-white truncate hover:underline cursor-pointer"
            >
              {isAdPlaying ? activeAd?.title : currentSong?.title}
            </p>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              {isAdPlaying ? activeAd?.clientName : currentSong?.artist}
            </p>
          </div>

          {!isAdPlaying && (
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={handleLikeToggle}
                className={`transition cursor-pointer p-1.5 rounded-lg hover:bg-white/5 ${isLiked ? 'text-heart-active' : 'text-on-surface-variant hover:text-white'}`}
              >
                <span className={`material-symbols-outlined ${isLiked ? 'filled' : ''}`}>favorite</span>
              </button>
              <button 
                onClick={() => setShowAddPlaylistModal(true)}
                className="transition cursor-pointer p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white"
                title="Thêm vào danh sách phát"
              >
                <span className="material-symbols-outlined text-lg">playlist_add</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Playback Controls & Waveform */}
        <div className="flex-1 max-w-[48%] flex flex-col items-center gap-1.5">
          {/* Audio Controls Buttons */}
          <div className="flex items-center gap-6">
            <button 
              disabled={isAdPlaying}
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer ${isShuffle ? 'text-tertiary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Shuffle"
            >
              <span className="material-symbols-outlined text-lg">shuffle</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playPrev}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Previous"
            >
              <span className="material-symbols-outlined text-xl">skip_previous</span>
            </button>

            {/* Skip -10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Backward 10s"
            >
              <span className="material-symbols-outlined text-xl">replay_10</span>
            </button>

            <button 
              onClick={togglePlay}
              className="w-11 h-11 rounded-full electric-btn flex items-center justify-center text-white hover:scale-105 transition cursor-pointer shadow-lg shadow-primary-container/20"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="material-symbols-outlined text-2xl filled">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Skip +10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-xl">forward_10</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playNext}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Next"
            >
              <span className="material-symbols-outlined text-xl">skip_next</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={handleLoopToggle}
              className={`p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer relative ${loopMode !== 'none' ? 'text-tertiary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Loop"
            >
              <span className="material-symbols-outlined text-lg">
                {loopMode === 'single' ? 'repeat_one' : 'repeat'}
              </span>
            </button>
          </div>

          {/* Waveform Progress Bar Container */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-on-surface-variant font-mono min-w-[30px] text-right">{formatTime(currentTime)}</span>
            
            {/* Waveform scroll container */}
            <div className={`flex-1 h-8 flex items-center justify-between gap-[2px] select-none relative ${isAdPlaying ? 'pointer-events-none opacity-40' : ''}`}>
              {/* Invisible range input for perfect slider behavior */}
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                onChange={(e) => {
                  if (isAdPlaying || duration <= 0) return;
                  seek(parseFloat(e.target.value));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {/* Waveform renderer */}
              <div className="absolute inset-0 flex items-center justify-between gap-[2px] w-full h-full pointer-events-none">
                {waveformData.map((val, idx) => {
                  const barPercent = (idx / waveformData.length) * 100;
                  const isPlayed = barPercent <= progressPercent;
                  return (
                    <div
                      key={idx}
                      className={`waveform-bar ${isPlayed ? 'waveform-active' : ''}`}
                      style={{ height: `${val * 100}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <span className="text-[10px] text-on-surface-variant font-mono min-w-[30px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Volume & Extra Utilities */}
        <div className="flex items-center gap-4 w-[24%] justify-end min-w-[150px]">
          {/* Lyrics button */}
          {!isAdPlaying && (
            <button 
              onClick={() => navigate('/player')}
              className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition cursor-pointer"
              title={t('lyrics')}
            >
              <span className="material-symbols-outlined text-xl">lyrics</span>
            </button>
          )}

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">
                {isMuted || volume === 0 ? 'volume_off' : volume < 0.4 ? 'volume_down' : 'volume_up'}
              </span>
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-tertiary transition"
            />
          </div>
        </div>

      </div>

      {showAddPlaylistModal && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Thêm vào Playlist</h3>
              <button 
                type="button"
                onClick={() => setShowAddPlaylistModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
              {userPlaylists.length > 0 ? (
                userPlaylists.map(pl => (
                  <button
                    key={pl._id}
                    onClick={() => handleAddSongToPlaylist(pl._id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-white/5 flex items-center gap-3 transition cursor-pointer"
                  >
                    <img src={pl.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'} className="w-8 h-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{pl.title}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{pl.songs?.length || 0} bài hát</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-on-surface-variant">Bạn chưa tạo danh sách phát nào.</p>
                  <button 
                    onClick={() => {
                      setShowAddPlaylistModal(false);
                      navigate('/library-playlists');
                    }}
                    className="text-xs text-primary font-bold hover:underline mt-2 cursor-pointer"
                  >
                    Tạo Playlist mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
