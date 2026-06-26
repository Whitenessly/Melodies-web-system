import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function FullscreenPlayer() {
  const { user } = useAuth();
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
    isAdPlaying
  } = usePlayer();

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [activePopupComment, setActivePopupComment] = useState(null);
  const [lyricsLines, setLyricsLines] = useState([]);

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

  useEffect(() => {
    if (currentSong) {
      loadComments();
      // Format lyrics lines
      if (currentSong.lyrics) {
        setLyricsLines(currentSong.lyrics.split('\n'));
      } else {
        setLyricsLines(['Chưa có lời bài hát cho tác phẩm này.']);
      }
    }
  }, [currentSong]);

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
      const response = await fetch(`http://localhost:8080/api/songs/${currentSong._id}/download-drm`, {
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
    <div className="min-h-screen bg-background text-white flex flex-col relative overflow-hidden p-6 md:p-12">
      
      {/* Background ambient blurring album art glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-15 scale-110 pointer-events-none transition duration-1000"
        style={{ backgroundImage: `url(${currentSong.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500'})` }}
      />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:text-white transition cursor-pointer"
        >
          <span className="material-symbols-outlined">expand_more</span>
        </button>
        <span className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Đang Phát</span>
        <button 
          onClick={handleDownloadDRM}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 transition rounded-xl text-xs font-bold text-white cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {t('download_drm')}
        </button>
      </div>

      {/* Central Interactive Panel Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto w-full">
        
        {/* Left Side: Spinning Vinyl Disc / Cover */}
        <div className="flex flex-col items-center justify-center gap-6 relative">
          
          {/* Real-time speech comment popup */}
          {activePopupComment && (
            <div className="absolute top-[-30px] bg-secondary-container text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-50 max-w-xs animate-bounce flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                {activePopupComment.userId?.avatarUrl ? (
                  <img src={activePopupComment.userId.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  activePopupComment.userId?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold opacity-75">{activePopupComment.userId?.name}</p>
                <p className="text-xs font-semibold mt-0.5">{activePopupComment.content}</p>
              </div>
            </div>
          )}

          {/* Disc Container */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            {/* Spinning ring outer */}
            <div className={`w-full h-full rounded-full border-4 border-white/5 p-8 transition-transform duration-1000 ${isPlaying && !isAdPlaying ? 'animate-spin [animation-duration:15s]' : ''}`}>
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
            <h2 className="font-display-lg text-2xl font-extrabold text-white tracking-tight">{currentSong.title}</h2>
            <p className="text-sm text-on-surface-variant font-medium mt-1">{currentSong.artist}</p>
          </div>
        </div>

        {/* Right Side: Scrollable Lyrics & Live Comments */}
        <div className="flex flex-col gap-6 h-[480px] md:h-[560px]">
          
          {/* Tab Menu */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 text-white">
              {t('lyrics')} / Lyrics
            </button>
          </div>

          {/* Lyrics container (Simulate simple display) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4 text-center">
            {lyricsLines.map((line, idx) => (
              <p 
                key={idx} 
                className={`text-sm md:text-base font-semibold transition ${
                  idx % 3 === Math.floor(currentTime / 10) % 3 
                    ? 'text-white scale-102 font-bold' 
                    : 'text-on-surface-variant/40'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Timeline comment posting form */}
          <form onSubmit={handlePostComment} className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 items-center">
            <span className="text-[10px] font-mono text-on-surface-variant px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg flex-shrink-0">
              {formatTime(currentTime)}
            </span>
            <input 
              type="text"
              placeholder="Để lại bình luận tại giây này..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-10 bg-transparent text-sm text-white placeholder-on-surface-variant outline-none px-2"
            />
            <button 
              type="submit"
              className="electric-btn text-white text-xs font-bold px-4 py-2 rounded-xl hover:scale-102 transition cursor-pointer flex-shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>

      </div>

      {/* Bottom SoundCloud Waveform & Player Controls */}
      <div className="relative z-10 max-w-4xl mx-auto w-full mt-10 border-t border-white/5 pt-6 flex flex-col gap-4">
        
        {/* Waveform Seek bar */}
        <div className="flex flex-col gap-2">
          <div 
            onClick={handleWaveformClick}
            className="w-full h-12 flex items-center justify-between gap-[2px] cursor-pointer relative"
          >
            {/* Waveform bars */}
            {(currentSong.waveform_data || Array.from({ length: 80 }, () => 0.5)).map((val, idx) => {
              const barPercent = (idx / 80) * 100;
              const isPlayed = barPercent <= progressPercent;
              return (
                <div 
                  key={idx}
                  className={`waveform-bar ${isPlayed ? 'waveform-active' : ''}`}
                  style={{ height: `${val * 100}%` }}
                />
              );
            })}

            {/* Render comments avatars at their timestamps */}
            {comments.map(c => {
              if (c.status !== 'visible' || !duration) return null;
              const leftPercent = (c.timestamp_seconds / duration) * 100;
              return (
                <div 
                  key={c._id}
                  className="absolute -top-1.5 transform -translate-x-1/2 w-5 h-5 rounded-full border border-white/20 bg-secondary-container overflow-hidden cursor-help hover:scale-110 hover:z-20 transition"
                  style={{ left: `${leftPercent}%` }}
                  title={`${c.userId?.name}: ${c.content} (tại ${formatTime(c.timestamp_seconds)})`}
                >
                  {c.userId?.avatarUrl ? (
                    <img src={c.userId.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">
                      {c.userId?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-8 pb-4">
          <button onClick={playPrev} className="text-on-surface-variant hover:text-white transition p-2 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined text-2xl">skip_previous</span>
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-14 h-14 rounded-full electric-btn flex items-center justify-center text-white hover:scale-105 transition cursor-pointer shadow-xl shadow-primary-container/20"
          >
            <span className="material-symbols-outlined text-3xl filled">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button onClick={playNext} className="text-on-surface-variant hover:text-white transition p-2 rounded-lg cursor-pointer">
            <span className="material-symbols-outlined text-2xl">skip_next</span>
          </button>
        </div>

      </div>

    </div>
  );
}
