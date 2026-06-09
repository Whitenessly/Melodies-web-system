import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import defaultCover from '../assets/default-cover.png';

import { createPortal } from 'react-dom';

const PlaylistDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { play, currentSong, isPlaying, toggleShuffle, shuffle } = usePlayer();
  const { user, toggleLikeSong, toggleLikePlaylist } = useAuth();

  // Dropdown & Edit Modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');
  const [editImage, setEditImage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const [playlist, setPlaylist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Extract ID from URL
  const queryParams = new URLSearchParams(location.search);
  const playlistId = queryParams.get('id');

  const fetchPlaylistData = async () => {
    if (!playlistId) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.get(`/playlists/${playlistId}`);
      setPlaylist(data.playlist);

      const songsData = await api.get('/songs');
      setAllSongs(songsData.songs || []);
    } catch (err) {
      console.error('Failed to load playlist details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistData();
  }, [playlistId]);

  const handlePlayPlaylist = () => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      play(playlist.songs[0], playlist.songs);
    }
  };

  const handleShufflePlay = () => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      // Toggle shuffle in context if it is not active
      if (!shuffle) {
        toggleShuffle();
      }
      // Pick a random starting song
      const randomIndex = Math.floor(Math.random() * playlist.songs.length);
      play(playlist.songs[randomIndex], playlist.songs);
    }
  };

  const handlePlaySong = (song) => {
    if (playlist && playlist.songs) {
      play(song, playlist.songs);
    }
  };

  const handleRemoveSong = async (e, songId) => {
    e.stopPropagation();
    if (!playlistId) return;
    try {
      await api.delete(`/playlists/${playlistId}/songs`, { body: { songId } });
      await fetchPlaylistData();
    } catch (err) {
      console.error('Failed to remove song:', err);
      alert('Không thể xóa bài hát khỏi playlist.');
    }
  };

  const handleAddSong = async (songId) => {
    if (!playlistId) return;
    try {
      await api.post(`/playlists/${playlistId}/songs`, { songId });
      await fetchPlaylistData();
    } catch (err) {
      console.error('Failed to add song:', err);
      alert('Không thể thêm bài hát vào playlist.');
    }
  };

  const handleDeletePlaylist = () => {
    setShowDeleteConfirmModal(true);
  };

  const executeDeletePlaylist = async () => {
    if (!playlistId) return;
    try {
      await api.delete(`/playlists/${playlistId}`);
      navigate('/library-playlists');
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      alert('Không thể xóa danh sách phát.');
    } finally {
      setShowDeleteConfirmModal(false);
    }
  };

  const handleLikeSong = async (e, songId) => {
    e.stopPropagation();
    try {
      await toggleLikeSong(songId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleOpenEdit = () => {
    if (playlist) {
      setEditTitle(playlist.title);
      setEditDesc(playlist.description || '');
      setEditVisibility(playlist.visibility || 'private');
      setEditImage('');
      setShowEditModal(true);
    }
    setShowDropdown(false);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setUpdating(true);
    try {
      await api.put(`/playlists/${playlistId}`, {
        title: editTitle,
        description: editDesc,
        visibility: editVisibility,
        image: editImage || undefined
      });
      setShowEditModal(false);
      await fetchPlaylistData();
    } catch (err) {
      console.error(err);
      alert('Cập nhật playlist thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const isLiked = (songId) => user?.likedSongs?.includes(songId) || false;

  const isPlaylistLiked = user?.likedPlaylists?.includes(playlistId) || false;

  const getPlaylistCover = () => {
    if (playlist && playlist.thumbnailUrl) {
      return getFullUrl(playlist.thumbnailUrl);
    }
    return defaultCover;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa rõ';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} thg ${month}, ${year}`;
  };

  const formatPlaylistDuration = (songsList) => {
    if (!songsList || songsList.length === 0) return '0 phút';
    const totalSeconds = songsList.length * 210;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `Khoảng ${hours} giờ ${minutes} phút`;
    }
    return `Khoảng ${minutes} phút`;
  };

  // Find songs that are NOT already in the playlist
  const existingSongIds = playlist?.songs ? playlist.songs.map(s => s._id) : [];
  const addableSongs = allSongs.filter(s => {
    const isNotInPlaylist = !existingSongIds.includes(s._id);
    const matchesSearch = searchQuery === '' || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotInPlaylist && matchesSearch;
  });

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="md:ml-sidebar-width min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center h-[calc(100vh-64px)] text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>Đang tải danh sách phát...</span>
          </div>
        </main>
        <MusicPlayer />
      </>
    );
  }

  if (!playlist) {
    return (
      <>
        <Sidebar />
        <main className="md:ml-sidebar-width min-h-screen bg-background p-8">
          <Header />
          <div className="glass-panel p-12 rounded-3xl text-center text-on-surface-variant max-w-lg mx-auto mt-20">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">playlist_remove</span>
            <p className="font-body-lg text-body-lg">Không tìm thấy danh sách phát này hoặc bạn không có quyền xem.</p>
            <button 
              onClick={() => navigate('/library-playlists')}
              className="mt-6 px-6 py-2 rounded-full bg-primary text-on-primary font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Quay lại thư viện
            </button>
          </div>
        </main>
        <MusicPlayer />
      </>
    );
  }

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pb-[120px] bg-background min-h-screen">
        <Header placeholder="Tìm kiếm trong danh sách phát..." />

        <div className="max-w-7xl mx-auto px-margin-page pt-12">
          
          {/* Header Banner Section (Stitch Template Design) */}
          <section className="header-gradient px-margin-page pt-12 pb-8 flex flex-col md:flex-row gap-8 items-end rounded-3xl p-6 border border-white/5 mb-6">
            <div className="relative group flex-shrink-0">
              <img 
                className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]" 
                src={getPlaylistCover()} 
                alt={playlist.title} 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-xl"></div>
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-primary/30">Playlist</span>
                <span className="bg-on-surface-variant/10 text-on-surface-variant px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px]">
                    {playlist.visibility === 'public' ? 'public' : 'lock'}
                  </span> 
                  {playlist.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface leading-tight font-bold">{playlist.title}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">{playlist.description || 'Không có mô tả cho danh sách phát này.'}</p>
              
              <div className="flex items-center justify-center md:justify-start gap-2 font-body-md text-on-surface-variant">
                <span className="text-on-surface font-semibold font-bold">{user?.name || 'Wesley Listener'}</span>
                <span className="opacity-40">•</span>
                <span>{playlist.songs?.length || 0} bài hát</span>
                <span className="opacity-40">•</span>
                <span>{formatPlaylistDuration(playlist.songs)}</span>
              </div>
            </div>
          </section>

          {/* Actions Section (Stitch Template Design) */}
          <section className="py-6 flex flex-wrap items-center gap-4 border-b border-outline-variant/20 mb-8">
            <button 
              onClick={handlePlayPlaylist}
              disabled={!playlist.songs || playlist.songs.length === 0}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-headline-md text-label-md flex items-center gap-2 neon-glow hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Phát ngay
            </button>
            <button 
              onClick={handleShufflePlay}
              disabled={!playlist.songs || playlist.songs.length === 0}
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-headline-md text-label-md flex items-center gap-2 border border-outline-variant/30 hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">shuffle</span>
              Trộn bài
            </button>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (toggleLikePlaylist && playlist) {
                  await toggleLikePlaylist(playlist._id);
                }
              }}
              className={`w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant transition-all cursor-pointer ${isPlaylistLiked ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isPlaylistLiked ? "'FILL' 1" : "'FILL' 0" }}>
                {isPlaylistLiked ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('add-songs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-headline-md text-label-md flex items-center gap-2 border border-outline-variant/30 hover:bg-surface-variant transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">add</span>
              Thêm bài hát
            </button>

            <div className="relative ml-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors cursor-pointer ${showDropdown ? 'text-primary bg-surface-variant/30' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface-container border border-white/10 shadow-2xl py-2 z-30">
                  <button 
                    onClick={handleOpenEdit}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Chỉnh sửa
                  </button>
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      handleDeletePlaylist();
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-error/10 text-label-md text-error font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Xóa playlist
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Song list in Playlist (Stitch Template Design) */}
          <section className="pb-12">
            <div className="glass-panel rounded-3xl p-6 border border-white/5 overflow-hidden">
              {playlist.songs && playlist.songs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-on-surface-variant border-b border-outline-variant/20 font-label-sm text-label-sm uppercase tracking-widest">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">Tiêu đề</th>
                      <th className="py-4 px-4">Album</th>
                      <th className="py-4 px-4">Ngày thêm</th>
                      <th className="py-4 px-4 text-right pr-12">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md">
                    {playlist.songs.map((song, i) => {
                      const isCurrent = currentSong?._id === song._id;
                      return (
                        <tr 
                          key={song._id}
                          onClick={() => handlePlaySong(song)}
                          className="group hover:bg-surface-variant/30 transition-colors rounded-lg cursor-pointer"
                        >
                          <td className="py-3 px-4 text-center text-on-surface-variant group-hover:text-primary">
                            <span className={isCurrent ? "hidden" : "group-hover:hidden font-bold"}>
                              {i + 1}
                            </span>
                            <span className={`material-symbols-outlined ${isCurrent ? "block text-primary" : "hidden group-hover:block text-primary"}`}>
                              {isCurrent && isPlaying ? "volume_up" : "play_arrow"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-4">
                              <img className="w-10 h-10 rounded-md object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                              <div>
                                <p className={`font-semibold group-hover:text-primary transition-colors ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                                  {song.title}
                                </p>
                                <p 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (song.artistId) navigate(`/artist-detail?id=${song.artistId}`);
                                  }}
                                  className="text-on-surface-variant text-sm hover:text-primary transition-colors cursor-pointer"
                                >
                                  {song.artist}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant">
                            {song.albumId?.title || 'Single'}
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant">
                            {formatDate(song.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right pr-8">
                            <div className="flex items-center justify-end gap-6">
                              <button 
                                onClick={(e) => handleRemoveSong(e, song._id)}
                                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                                title="Xóa khỏi playlist"
                              >
                                delete
                              </button>
                              <button 
                                onClick={(e) => handleLikeSong(e, song._id)}
                                className={`material-symbols-outlined hover:scale-110 transition-transform cursor-pointer ${isLiked(song._id) ? 'text-primary' : 'text-on-surface-variant group-hover:visible invisible'}`}
                              >
                                {isLiked(song._id) ? 'favorite' : 'favorite_border'}
                              </button>
                              <span className="text-on-surface-variant text-sm font-mono w-10">3:30</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3">playlist_play</span>
                  <p className="font-body-md">Chưa có bài hát nào trong playlist này.</p>
                </div>
              )}
            </div>
          </section>

          {/* Add Songs to Playlist Section */}
          <section id="add-songs-section" className="scroll-mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-headline-md text-headline-md text-white font-bold">Thêm bài hát mới</h3>
              
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-full pl-12 pr-6 py-2 text-label-md text-white placeholder-on-surface-variant/50 focus:bg-white/10 focus:border-primary transition-all outline-none"
                  placeholder="Tìm kiếm bài hát..."
                />
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/5 overflow-hidden">
              {addableSongs.length > 0 ? (
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-white/5">
                      <th className="px-6 py-4 font-normal">Tiêu đề</th>
                      <th className="px-6 py-4 font-normal">Thể loại</th>
                      <th className="px-6 py-4 font-normal text-right">Thêm vào</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-4">
                    {addableSongs.map((song) => (
                      <tr 
                        key={song._id}
                        className="group hover:bg-white/5 transition-colors rounded-xl"
                      >
                        <td className="px-6 py-4 first:rounded-l-xl">
                          <div className="flex items-center gap-4">
                            <img className="w-10 h-10 rounded-lg object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                            <div className="min-w-0 overflow-hidden">
                              <p className="font-label-md text-label-md text-white font-bold truncate">
                                {song.title}
                              </p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                          {song.genre}
                        </td>
                        <td className="px-6 py-4 last:rounded-r-xl text-right">
                          <button 
                            onClick={() => handleAddSong(song._id)}
                            className="bg-primary/20 text-primary hover:bg-primary hover:text-on-primary rounded-lg p-2 transition-all cursor-pointer font-bold inline-flex items-center justify-center gap-1 text-label-md"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                            Thêm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  <p className="font-body-md">Không có bài hát nào phù hợp để thêm.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Playlist Edit Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">Chỉnh sửa Playlist</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Tên Playlist</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none"
                  placeholder="Nhập tên playlist..."
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Mô tả</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none resize-none"
                  placeholder="Nhập mô tả ngắn..."
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Quyền truy cập</label>
                <select 
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none"
                >
                  <option value="private">Riêng tư (Private)</option>
                  <option value="public">Công khai (Public)</option>
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Ảnh bìa mới (Tùy chọn)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleEditFileChange}
                  className="w-full text-label-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-label-sm file:font-semibold file:bg-primary/20 file:text-primary file:cursor-pointer hover:file:bg-primary/30"
                />
              </div>

              <button 
                type="submit" 
                disabled={updating}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer flex justify-center items-center mt-6"
              >
                {updating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Warning Modal */}
      {showDeleteConfirmModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-sm border border-error/20 relative shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-error text-6xl mb-4 select-none">warning</span>
              <h3 className="font-headline-md text-headline-md text-white mb-2 font-bold">Cảnh Báo Xóa</h3>
              <p className="text-on-surface-variant font-body-md text-body-md mb-6">
                Bạn có chắc chắn muốn xóa danh sách phát <span className="text-white font-bold">"{playlist?.title}"</span> không? Hành động này không thể hoàn tác.
              </p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={executeDeletePlaylist}
                  className="flex-1 py-3 bg-error text-on-error rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <MusicPlayer />
    </>
  );
};

export default PlaylistDetail;
