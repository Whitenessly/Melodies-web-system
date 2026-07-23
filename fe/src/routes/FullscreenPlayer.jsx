import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, BASE_URL } from '../utils/api.js';

export default function FullscreenPlayer() {
  const { user, updateProfileState } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playNext,
    playPrev,
    togglePlay,
    seek,
    isAdPlaying,
    isShuffle,
    setIsShuffle,
    loopMode,
    setLoopMode,
    volume,
    setVolume,
    isMuted,
    setIsMuted
  } = usePlayer();

  const handleLoopToggle = () => {
    if (loopMode === 'none') setLoopMode('all');
    else if (loopMode === 'all') setLoopMode('single');
    else setLoopMode('none');
  };

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [activePopupComment, setActivePopupComment] = useState(null);
  const [lyricsLines, setLyricsLines] = useState([]);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [artistInfo, setArtistInfo] = useState(null);

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

  useEffect(() => {
    if (user && currentSong) {
      setIsLiked(user.likedSongs?.includes(currentSong._id));
    }
  }, [user, currentSong]);

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

  // Load comments
  const loadComments = async () => {
    if (!currentSong) return;
    try {
      const data = await api.get(`/comments?songId=${currentSong._id}`);
      setComments(data);
    } catch (err) {
      console.log('Failed to load comments:', err.message);
    }
  };

  const loadArtistInfo = async () => {
    if (!currentSong) return;
    const id = currentSong.artistId?._id || currentSong.artistId;
    if (!id) return;
    try {
      const data = await api.get(`/users/${id}`);
      setArtistInfo(data);
    } catch (err) {
      console.log('Failed to fetch artist info:', err.message);
    }
  };

  useEffect(() => {
    if (currentSong) {
      loadComments();
      loadArtistInfo();
      // Format lyrics lines
      if (currentSong.lyrics) {
        setLyricsLines(currentSong.lyrics.split('\n'));
      } else {
        setLyricsLines([t('no_lyrics')]);
      }
    }
  }, [currentSong, t]);

  // Real-time floating pop-ups: check if a comment exists at the current second
  useEffect(() => {
    if (isAdPlaying || !isPlaying) return;
    const roundedTime = Math.floor(currentTime);
    const match = comments.find(c => c.timestamp_seconds === roundedTime && c.status === 'visible');
    if (match) {
      setActivePopupComment(match);
      const timer = setTimeout(() => setActivePopupComment(null), 3500); // hide after 3.5s
      return () => clearTimeout(timer);
    }
  }, [currentTime, comments, isPlaying, isAdPlaying]);

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary gap-4">
        <span className="material-symbols-outlined text-5xl">music_note</span>
        <button onClick={() => navigate('/home')} className="electric-btn text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer">
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const timestamp_seconds = Math.floor(currentTime);
      const res = await api.post('/comments', {
        songId: currentSong._id,
        content: commentText,
        rating: commentRating,
        timestamp_seconds
      });

      setCommentText('');
      if (res.flagged) {
        alert(res.message); // Tell user comment flagged
      } else {
        setComments(prev => [res.comment, ...prev]);
      }
    } catch (err) {
      console.log('Failed to post comment:', err.message);
    }
  };

  const handleDownloadDRM = async () => {
    if (user.premium_status !== 'PREMIUM') {
      alert('Vui lòng nâng cấp tài khoản Premium để tải nhạc bản quyền offline DRM!');
      navigate('/subscription-plans');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/songs/${currentSong._id}/download-drm`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('DRM download authorization failed');
      }

      // Download file blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSong.title.replace(/\s+/g, '_')}.melodrm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Tải nhạc thất bại: ' + err.message);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleWaveformClick = (e) => {
    if (isAdPlaying || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    seek(percent * duration);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col relative overflow-hidden pt-4 pb-6 px-6 md:pt-6 md:pb-12 md:px-12 select-none">
      
      {/* Background ambient blurring album art glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-[120px] opacity-20 scale-105 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${currentSong.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500'})` }}
      />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between mb-4 md:mb-6 max-w-6xl mx-auto w-full">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 hover:border-white/10 transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">expand_more</span>
        </button>
        <span className="text-xs uppercase font-extrabold tracking-widest text-on-surface-variant/80">{t('now_playing')}</span>
        <button 
          onClick={handleDownloadDRM}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition rounded-full text-xs font-bold text-white cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {t('download_drm')}
        </button>
      </div>

      {/* Central Interactive Panel Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto w-full my-auto">
        
        {/* Left Side: Spinning Vinyl Disc / Cover */}
        <div className="flex flex-col items-center justify-center gap-8 relative">
          
          {/* Real-time speech comment popup */}
          {activePopupComment && (
            <div className="absolute top-[-30px] bg-black/90 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-50 max-w-xs animate-bounce flex items-start gap-2.5 backdrop-blur-md">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 border border-white/10">
                {activePopupComment.userId?.avatarUrl ? (
                  <img src={activePopupComment.userId.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  activePopupComment.userId?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-primary">{activePopupComment.userId?.name}</p>
                <p className="text-xs font-medium mt-0.5 text-white/90">{activePopupComment.content}</p>
              </div>
            </div>
          )}

          {/* Disc Container */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Spinning ring outer */}
            <div className={`w-full h-full rounded-full border-4 border-white/5 p-6 transition-transform duration-1000 bg-black/40 shadow-2xl ${isPlaying && !isAdPlaying ? 'animate-spin [animation-duration:20s]' : ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden shadow-2xl relative border-4 border-white/10">
                <img 
                  src={currentSong.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500'} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover" 
                />
                {/* Center hole vinyl aesthetic */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-background border-4 border-white/10 flex items-center justify-center shadow-inner">
                  <div className="w-4 h-4 rounded-full bg-white/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Song Metadata */}
          <div className="text-center">
            <h2 className="font-display-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight">{currentSong.title}</h2>
            <p className="text-sm text-on-surface-variant font-semibold mt-1.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Right Side: Scrollable Lyrics & Live Comments */}
        <div className={`flex flex-col gap-4 ${isLyricsOpen ? 'h-[380px]' : 'h-auto'} md:h-[450px] transition-all duration-300`}>
          
          {/* Tab Menu / Mobile Toggle */}
          <div className="flex bg-[#121212]/60 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setIsLyricsOpen(!isLyricsOpen)}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-white/5 text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">lyrics</span>
              <span>{t('lyrics')}</span>
              <span className="material-symbols-outlined text-sm md:hidden">
                {isLyricsOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {/* Lyrics & Comment Form Container (Collapsible on mobile) */}
          <div className={`${isLyricsOpen ? 'flex' : 'hidden md:flex'} flex-col gap-5 flex-1 min-h-0`}>
            {/* Lyrics container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212]/30 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-center justify-center">
              {lyricsLines.map((line, idx) => (
                <p 
                  key={idx} 
                  className={`text-sm md:text-base font-bold transition duration-300 ${
                    idx % 3 === Math.floor(currentTime / 10) % 3 
                      ? 'text-white scale-105 font-extrabold' 
                      : 'text-on-surface-variant/30 font-medium'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Timeline comment posting form */}
            <form onSubmit={handlePostComment} className="flex gap-2 bg-[#121212]/50 p-2 rounded-2xl border border-white/5 items-center">
              <span className="text-[10px] font-bold font-mono text-primary px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl flex-shrink-0">
                {formatTime(currentTime)}
              </span>
              <input 
                type="text"
                placeholder={t('comment_placeholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 h-10 bg-transparent text-sm text-white placeholder-on-surface-variant outline-none px-2 font-medium"
              />
              <button 
                type="submit"
                className="bg-primary text-black text-xs font-extrabold px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition cursor-pointer flex-shrink-0"
              >
                {t('send_comment')}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Bottom SoundCloud Waveform & Player Controls */}
      <div className="relative z-10 max-w-4xl mx-auto w-full mt-10 border-t border-white/5 pt-6 flex flex-col gap-5">
        
        {/* Waveform Seek bar */}
        <div className="flex flex-col gap-2">
          <div 
            onClick={handleWaveformClick}
            className="w-full h-12 flex items-center justify-between gap-[2.5px] cursor-pointer relative select-none"
          >
            {/* Waveform bars */}
            {(() => {
              const waveformData = currentSong.waveform_data || Array.from({ length: 85 }, () => 0.5);
              return waveformData.map((val, idx) => {
                const barPercent = (idx / waveformData.length) * 100;
                const isPlayed = barPercent <= progressPercent;
                return (
                  <div 
                    key={idx}
                    className={`flex-1 rounded-full transition-all duration-200 ${isPlayed ? 'bg-primary shadow-sm shadow-primary/30 h-[90%]' : 'bg-white/10 h-[50%]'}`}
                    style={{ height: `${val * 100}%` }}
                  />
                );
              });
            })()}

            {/* Render comments avatars at their timestamps */}
            {comments.map(c => {
              if (c.status !== 'visible' || !duration) return null;
              const leftPercent = (c.timestamp_seconds / duration) * 100;
              return (
                <div 
                  key={c._id}
                  className="absolute -top-1.5 transform -translate-x-1/2 w-5.5 h-5.5 rounded-full border border-white/20 bg-[#121212] overflow-hidden cursor-help hover:scale-125 hover:z-20 transition"
                  style={{ left: `${leftPercent}%` }}
                  title={`${c.userId?.name}: ${c.content} (tại ${formatTime(c.timestamp_seconds)})`}
                >
                  {c.userId?.avatarUrl ? (
                    <img src={c.userId.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white bg-zinc-800">
                      {c.userId?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono font-bold mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-1 md:gap-6 pb-2 md:pb-4">
          
          {/* Left Column: Like & Add Playlist buttons (Desktop only) */}
          <div className="hidden md:flex items-center gap-1 md:gap-1.5 shrink-0">
            {!isAdPlaying && (
              <>
                <button 
                  onClick={handleLikeToggle}
                  className={`transition cursor-pointer p-2 md:p-2.5 rounded-full hover:bg-white/5 ${isLiked ? 'text-heart-active' : 'text-on-surface-variant hover:text-white'}`}
                  title="Thích"
                >
                  <span className={`material-symbols-outlined text-xl md:text-2xl flex items-center justify-center ${isLiked ? 'filled' : ''}`}>favorite</span>
                </button>
                <button 
                  onClick={() => setShowAddPlaylistModal(true)}
                  className="transition cursor-pointer p-2 md:p-2.5 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-white"
                  title="Thêm vào danh sách phát"
                >
                  <span className="material-symbols-outlined text-xl md:text-2xl flex items-center justify-center">playlist_add</span>
                </button>
              </>
            )}
          </div>

          {/* Center Column: Playback controls */}
          <div className="flex-1 flex items-center justify-center gap-2 md:gap-3">
            <button 
              disabled={isAdPlaying}
              onClick={() => setIsShuffle(!isShuffle)}
              className={`hidden md:inline-flex p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Shuffle"
            >
              <span className="material-symbols-outlined text-xl flex items-center justify-center">shuffle</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playPrev}
              className={`p-2 rounded-md md:p-2.5 md:rounded-full hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Previous"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">skip_previous</span>
            </button>

            {/* Skip -10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className={`p-2 rounded-md md:p-2.5 md:rounded-full hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Backward 10s"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">replay_10</span>
            </button>

            <button 
              onClick={togglePlay}
              className="w-13 h-13 md:w-14 md:h-14 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center hover:scale-105 transition cursor-pointer shadow-xl shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="material-symbols-outlined text-3xl filled flex items-center justify-center">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Skip +10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className={`p-2 rounded-md md:p-2.5 md:rounded-full hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">forward_10</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playNext}
              className={`p-2 rounded-md md:p-2.5 md:rounded-full hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Next"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">skip_next</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={handleLoopToggle}
              className={`hidden md:inline-flex p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer relative ${loopMode !== 'none' ? 'text-primary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Loop"
            >
              <span className="material-symbols-outlined text-xl flex items-center justify-center">
                {loopMode === 'single' ? 'repeat_one' : 'repeat'}
              </span>
            </button>
          </div>

          {/* Right Column: Volume Control (Desktop only) */}
          <div className="hidden md:flex items-center gap-2.5 w-[24%] justify-end">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-white transition cursor-pointer"
              title="Mute/Unmute"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">
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
              className="w-24 accent-primary"
            />
          </div>

        </div>

        {/* Mobile Secondary Controls Row: Like & Playlist on Left | Shuffle, Loop & Volume on Right */}
        <div className="flex md:hidden items-center justify-between pt-2 px-1 border-t border-white/5">
          {/* Left Side: Like & Add to Playlist */}
          <div className="flex items-center gap-1">
            {!isAdPlaying && (
              <>
                <button 
                  onClick={handleLikeToggle}
                  className={`p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer ${isLiked ? 'text-heart-active' : 'text-on-surface-variant'}`}
                  title="Thích"
                >
                  <span className={`material-symbols-outlined text-2xl flex items-center justify-center ${isLiked ? 'filled' : ''}`}>favorite</span>
                </button>

                <button 
                  onClick={() => setShowAddPlaylistModal(true)}
                  className="p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer text-on-surface-variant"
                  title="Thêm vào danh sách phát"
                >
                  <span className="material-symbols-outlined text-2xl flex items-center justify-center">playlist_add</span>
                </button>
              </>
            )}
          </div>

          {/* Right Side: Shuffle, Loop & Volume Control */}
          <div className="flex items-center gap-1">
            <button 
              disabled={isAdPlaying}
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer ${isShuffle ? 'text-primary' : 'text-on-surface-variant'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Trộn bài"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">shuffle</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={handleLoopToggle}
              className={`p-2.5 rounded-full hover:bg-white/5 transition cursor-pointer ${loopMode !== 'none' ? 'text-primary' : 'text-on-surface-variant'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Lặp bài"
            >
              <span className="material-symbols-outlined text-2xl flex items-center justify-center">
                {loopMode === 'single' ? 'repeat_one' : 'repeat'}
              </span>
            </button>

            {/* Volume Control on Mobile */}
            <div className="flex items-center gap-1 pl-1">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-white transition cursor-pointer"
                title="Mute/Unmute"
              >
                <span className="material-symbols-outlined text-2xl flex items-center justify-center">
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
                className="w-16 accent-primary"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Artist Info Section */}
      {artistInfo && (
        <div className="relative z-10 max-w-4xl mx-auto w-full mt-8 mb-12 bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-xl animate-fade-in">
          {/* Ambient blur backdrop local */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-5 pointer-events-none rounded-3xl"
            style={{ backgroundImage: `url(${artistInfo.avatarUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'})` }}
          />
          
          {/* Artist Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-800 flex items-center justify-center font-bold text-2xl relative shadow-md">
            {artistInfo.avatarUrl ? (
              <img src={artistInfo.avatarUrl} alt={artistInfo.name} className="w-full h-full object-cover" />
            ) : (
              artistInfo.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 text-center sm:text-left min-w-0 relative z-10">
            <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full w-max mx-auto sm:mx-0 font-semibold">
              {t('artist_label')}
            </span>
            <h3 className="font-display-lg text-lg font-extrabold text-white mt-2">{artistInfo.name}</h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2 font-medium">
              {artistInfo.bio || t('no_description')}
            </p>
            <p className="text-[10px] text-on-surface-variant font-bold mt-1">
              {artistInfo.followersCount || 0} {t('followers_suffix')}
            </p>
          </div>

          {/* Navigate Button */}
          <button 
            onClick={() => navigate(`/artist-detail?id=${artistInfo._id}`)}
            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs cursor-pointer active:scale-98 transition shrink-0 shadow-lg relative z-10 flex items-center gap-1.5 hover:scale-105"
          >
            <span>{t('artist_page')}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {showAddPlaylistModal && createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">{t('add_to_playlist')}</h3>
              <button 
                type="button"
                onClick={() => setShowAddPlaylistModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer transition duration-150"
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
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{pl.songs?.length || 0} {t('songs')}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-on-surface-variant font-medium">{t('no_playlists_yet')}</p>
                  <button 
                    onClick={() => {
                      setShowAddPlaylistModal(false);
                      navigate('/library-playlists');
                    }}
                    className="text-xs text-primary font-bold hover:underline mt-2 cursor-pointer"
                  >
                    {t('create_new_playlist_prompt')}
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
