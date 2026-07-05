import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

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
    <div className="min-h-screen bg-background text-white flex flex-col relative overflow-hidden pt-4 pb-6 px-6 md:pt-6 md:pb-12 md:px-12">
      
      {/* Background ambient blurring album art glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-15 scale-110 pointer-events-none transition duration-1000"
        style={{ backgroundImage: `url(${currentSong.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500'})` }}
      />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between mb-4 md:mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:text-white transition cursor-pointer"
        >
          <span className="material-symbols-outlined">expand_more</span>
        </button>
        <span className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">{t('now_playing')}</span>
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
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Spinning ring outer */}
            <div className={`w-full h-full rounded-full border-4 border-white/5 p-6 transition-transform duration-1000 ${isPlaying && !isAdPlaying ? 'animate-spin [animation-duration:15s]' : ''}`}>
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
        <div className="flex flex-col gap-6 h-[380px] md:h-[450px]">
          
          {/* Tab Menu */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 text-white">
              {t('lyrics')}
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
              placeholder={t('comment_placeholder')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-10 bg-transparent text-sm text-white placeholder-on-surface-variant outline-none px-2"
            />
            <button 
              type="submit"
              className="electric-btn text-white text-xs font-bold px-4 py-2 rounded-xl hover:scale-102 transition cursor-pointer flex-shrink-0"
            >
              {t('send_comment')}
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
        <div className="flex items-center justify-between gap-6 pb-4">
          
          {/* Left Column: Like & Add Playlist buttons */}
          <div className="flex items-center gap-2 w-[24%] justify-start">
            {!isAdPlaying && (
              <>
                <button 
                  onClick={handleLikeToggle}
                  className={`transition cursor-pointer p-2 rounded-lg hover:bg-white/5 ${isLiked ? 'text-heart-active' : 'text-on-surface-variant hover:text-white'}`}
                  title="Thích"
                >
                  <span className={`material-symbols-outlined text-2xl ${isLiked ? 'filled' : ''}`}>favorite</span>
                </button>
                <button 
                  onClick={() => setShowAddPlaylistModal(true)}
                  className="transition cursor-pointer p-2 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white"
                  title="Thêm vào danh sách phát"
                >
                  <span className="material-symbols-outlined text-2xl">playlist_add</span>
                </button>
              </>
            )}
          </div>

          {/* Center Column: Playback controls */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <button 
              disabled={isAdPlaying}
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer ${isShuffle ? 'text-tertiary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Shuffle"
            >
              <span className="material-symbols-outlined text-xl">shuffle</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playPrev}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Previous"
            >
              <span className="material-symbols-outlined text-2xl">skip_previous</span>
            </button>

            {/* Skip -10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Backward 10s"
            >
              <span className="material-symbols-outlined text-2xl">replay_10</span>
            </button>

            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full electric-btn flex items-center justify-center text-white hover:scale-105 transition cursor-pointer shadow-xl shadow-primary-container/20 shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="material-symbols-outlined text-3xl filled">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Skip +10s */}
            <button 
              disabled={isAdPlaying}
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-2xl">forward_10</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={playNext}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer text-on-surface-variant hover:text-white ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Next"
            >
              <span className="material-symbols-outlined text-2xl">skip_next</span>
            </button>

            <button 
              disabled={isAdPlaying}
              onClick={handleLoopToggle}
              className={`p-2 rounded-lg hover:bg-white/5 transition cursor-pointer relative ${loopMode !== 'none' ? 'text-tertiary' : 'text-on-surface-variant hover:text-white'} ${isAdPlaying ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Loop"
            >
              <span className="material-symbols-outlined text-xl">
                {loopMode === 'single' ? 'repeat_one' : 'repeat'}
              </span>
            </button>
          </div>

          {/* Right Column: Volume Control */}
          <div className="flex items-center gap-2 w-[24%] justify-end">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition cursor-pointer"
              title="Mute/Unmute"
            >
              <span className="material-symbols-outlined text-2xl">
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
              className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-tertiary transition"
            />
          </div>

        </div>

      </div>

      {/* Artist Info Section */}
      {artistInfo && (
        <div className="relative z-10 max-w-4xl mx-auto w-full mt-8 mb-12 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center gap-6 shadow-xl animate-fade-in">
          {/* Ambient blur backdrop local */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-5 pointer-events-none rounded-3xl"
            style={{ backgroundImage: `url(${artistInfo.avatarUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'})` }}
          />
          
          {/* Artist Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 shrink-0 bg-secondary-container flex items-center justify-center font-bold text-2xl relative shadow-md">
            {artistInfo.avatarUrl ? (
              <img src={artistInfo.avatarUrl} alt={artistInfo.name} className="w-full h-full object-cover" />
            ) : (
              artistInfo.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 text-center sm:text-left min-w-0 relative z-10">
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-secondary-container/20 border border-secondary-container/30 rounded text-secondary-container w-max mx-auto sm:mx-0">
              {t('artist_label')}
            </span>
            <h3 className="font-display-lg text-lg font-extrabold text-white mt-1.5">{artistInfo.name}</h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
              {artistInfo.bio || t('no_description')}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium mt-1">
              {artistInfo.followersCount || 0} {t('followers_suffix')}
            </p>
          </div>

          {/* Navigate Button */}
          <button 
            onClick={() => navigate(`/artist-detail?id=${artistInfo._id}`)}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs cursor-pointer active:scale-98 transition shrink-0 shadow-lg relative z-10 flex items-center gap-1.5"
          >
            <span>{t('artist_page')}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {showAddPlaylistModal && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">{t('add_to_playlist')}</h3>
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
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{pl.songs?.length || 0} {t('songs')}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-on-surface-variant">{t('no_playlists_yet')}</p>
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
