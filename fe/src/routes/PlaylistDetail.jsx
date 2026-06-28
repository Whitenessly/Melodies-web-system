import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

export default function PlaylistDetail() {
  const { playSong } = usePlayer();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit playlist states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');
  const [loadingEdit, setLoadingEdit] = useState(false);

  // States & refs for adding/deleting songs and 3-dot menu
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const actionMenuRef = useRef(null);

  // Close action menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all approved songs for the Add Songs modal
  useEffect(() => {
    const fetchAllSongs = async () => {
      try {
        const data = await api.get('/songs?isApproved=true');
        const songsList = Array.isArray(data) ? data : (data.songs || []);
        setAllSongs(songsList);
      } catch (err) {
        console.error(err);
      }
    };
    if (showAddSongsModal) {
      fetchAllSongs();
    }
  }, [showAddSongsModal]);

  const handleAddSong = async (song) => {
    try {
      await api.post(`/playlists/${playlistId}/add`, { songId: song._id });
      setSongs(prev => [...prev, song]);
    } catch (err) {
      alert('Không thể thêm bài hát vào danh sách phát: ' + err.message);
    }
  };

  const filteredSongs = allSongs.filter(s => 
    s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(songSearchQuery.toLowerCase())
  );


  // File upload states for editing
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploading(false);
          setEditThumbnailUrl(reader.result);
        }
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const searchParams = new URLSearchParams(location.search);
  const playlistId = searchParams.get('id');

  const loadPlaylistDetails = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      if (playlistId === 'liked') {
        setPlaylist({
          title: t('liked_songs'),
          description: t('liked_songs_playlist_desc'),
          thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          visibility: 'private',
          isLikedSpecial: true,
          owner: 'Melodies'
        });
        const likedSongs = await api.get('/users/liked-songs');
        setSongs(likedSongs);
      } else {
        const details = await api.get(`/playlists/${playlistId}`);
        setPlaylist(details);
        setSongs(details.songs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlistId]);

  const handleRemoveTrack = async (songId) => {
    if (playlistId === 'liked') {
      try {
        await api.post(`/songs/${songId}/unlike`);
        setSongs(prev => prev.filter(s => s._id !== songId));
      } catch (err) {
        alert(err.message);
      }
    } else {
      try {
        await api.post(`/playlists/${playlistId}/remove`, { songId });
        setSongs(prev => prev.filter(s => s._id !== songId));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setLoadingEdit(true);
    try {
      const updated = await api.put(`/playlists/${playlistId}`, {
        title: editTitle,
        description: editDescription,
        thumbnailUrl: editThumbnailUrl,
        visibility: editVisibility
      });
      setPlaylist(updated);
      setShowEditModal(false);
      setFileName('');
      setUploadProgress(0);
      setUploading(false);
    } catch (err) {
      alert('Cập nhật playlist thất bại: ' + err.message);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeletePlaylist = async () => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa danh sách phát này?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/playlists/${playlistId}`);
      alert('Đã xóa danh sách phát thành công!');
      navigate('/library-playlists');
    } catch (err) {
      alert('Xóa thất bại: ' + err.message);
    }
  };

  const isOwner = playlist && user && (
    (playlist.userId?._id || playlist.userId) === (user.id || user._id)
  );

  // Play entire list
  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  // Shuffle and play
  const handleShufflePlay = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  // Calculate total playlist duration helper
  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const formatTotalDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h} giờ ${m} phút`;
    }
    return `${m} phút`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center text-secondary-container">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <p>{t('playlist_not_found')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          
          {/* Playlist Header Section from Stitch */}
          <div className="flex flex-col md:flex-row gap-8 items-end mb-4 relative z-10">
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 relative group">
              <img 
                src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                {playlist.isLikedSpecial ? t('playlist') : t(playlist.visibility) || 'PLAYLIST'}
              </span>
              
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <h1 className="font-display-lg text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {playlist.title}
                </h1>
              </div>
              
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-xl leading-relaxed">
                {playlist.description}
              </p>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant font-medium">
                <span className="font-bold text-white">{playlist.userId?.name || playlist.owner || 'Melodies User'}</span>
                <span className="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                <span>{songs.length} bài hát</span>
                {songs.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                    <span>Khoảng {formatTotalDuration(totalDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="h-11 px-6 rounded-full bg-status-success hover:bg-status-success/90 text-black font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-status-success/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              <span>PHÁT TẤT CẢ</span>
            </button>
            
            <button 
              onClick={handleShufflePlay}
              disabled={songs.length === 0}
              className="h-11 px-6 rounded-full border border-white/20 font-bold flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              <span className="material-symbols-outlined text-base">shuffle</span>
              <span>XÁO TRỘN</span>
            </button>

            {isOwner && !playlist.isLikedSpecial && (
              <button 
                onClick={() => setShowAddSongsModal(true)}
                className="h-11 px-6 rounded-full border border-white/20 font-bold flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-xs md:text-sm text-white"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>THÊM BÀI HÁT</span>
              </button>
            )}

            {isOwner && !playlist.isLikedSpecial && (
              <div className="relative" ref={actionMenuRef}>
                <button 
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-white"
                >
                  <span className="material-symbols-outlined text-base">more_horiz</span>
                </button>

                {showActionMenu && (
                  <div className="absolute left-0 top-13 w-48 glass-panel rounded-2xl p-2 shadow-2xl z-50 border border-white/10 flex flex-col gap-1">
                    <button 
                      onClick={() => {
                        setEditTitle(playlist.title);
                        setEditDescription(playlist.description || '');
                        setEditThumbnailUrl(playlist.thumbnailUrl || '');
                        setEditVisibility(playlist.visibility || 'public');
                        setShowEditModal(true);
                        setShowActionMenu(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs font-semibold text-white transition text-left"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span>Chỉnh sửa thông tin</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirmModal(true);
                        setShowActionMenu(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs font-semibold text-error transition text-left"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      <span>Xóa danh sách phát</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Track List Table from Stitch */}
          <div className="w-full overflow-x-auto">
            {songs.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-4 pl-4 w-12">#</th>
                    <th className="pb-4">TIÊU ĐỀ</th>
                    <th className="pb-4 hidden lg:table-cell">ALBUM</th>
                    <th className="pb-4 hidden md:table-cell">NGÀY THÊM</th>
                    <th className="pb-4 text-right pr-4 w-28">
                      <span className="material-symbols-outlined text-base">schedule</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {songs.map((song, idx) => (
                    <tr 
                      key={song._id}
                      className="track-row group hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {/* Index / Hover Play */}
                      <td className="py-4 pl-4 text-on-surface-variant font-mono text-xs w-12">
                        <span className="group-hover:hidden block">{idx + 1}</span>
                        <button 
                          onClick={() => playSong(song, songs, idx)}
                          className="group-hover:flex hidden items-center justify-center text-primary hover:text-white cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </button>
                      </td>

                      {/* Title, Artist and Cover Thumbnail */}
                      <td className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-surface-container shrink-0 border border-white/5">
                            <img 
                              src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} 
                              className="w-full h-full object-cover" 
                              alt="" 
                            />
                          </div>
                          <div>
                            <p 
                              onClick={() => playSong(song, songs, idx)}
                              className="text-xs font-bold text-white group-hover:text-primary transition-colors cursor-pointer"
                            >
                              {song.title}
                            </p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{song.artist}</p>
                          </div>
                        </div>
                      </td>

                      {/* Album (Default to Single if not found) */}
                      <td className="py-4 hidden lg:table-cell text-xs text-on-surface-variant">
                        {song.album || 'Single'}
                      </td>

                      {/* Added Date */}
                      <td className="py-4 hidden md:table-cell text-xs text-on-surface-variant">
                        {song.createdAt ? new Date(song.createdAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                      </td>

                      {/* Duration & Delete Item */}
                      <td className="py-4 text-right pr-4 text-xs text-on-surface-variant font-mono">
                        <div className="flex items-center justify-end gap-3">
                          <span>
                            {Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}
                          </span>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrack(song._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition p-1 hover:bg-white/5 rounded-lg cursor-pointer"
                            title={t('remove_track')}
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                <p className="text-xs text-on-surface-variant">{t('no_songs_in_playlist')}</p>
              </div>
            )}
          </div>

        </main>
      </div>
      
      <MusicPlayer />

      {/* Edit Playlist Modal Overlay */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form onSubmit={handleUpdatePlaylist} className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Chỉnh sửa Playlist</h3>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Tên danh sách phát</label>
              <input 
                type="text" 
                required 
                placeholder="Tên playlist" 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Mô tả ngắn</label>
              <input 
                type="text" 
                placeholder="Mô tả danh sách phát..." 
                value={editDescription} 
                onChange={e => setEditDescription(e.target.value)} 
                className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" 
              />
            </div>

            {/* Cover Image Upload (Image instead of URL) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Ảnh đại diện Playlist</label>
              <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                <label className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold cursor-pointer transition select-none self-start">
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>Chọn ảnh</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>

                {/* Progress Bar */}
                {uploading && (
                  <div className="w-full flex flex-col gap-1 mt-1">
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-electric-gradient transition-all duration-100" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview Image & Filename */}
                {editThumbnailUrl && !uploading && (
                  <div className="flex items-center gap-3 mt-1 p-2 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                    <img 
                      src={editThumbnailUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-lg object-cover border border-white/10" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-white truncate">{fileName || 'playlist-cover.jpg'}</p>
                      <p className="text-[9px] text-status-success font-bold uppercase tracking-wider mt-0.5">Upload complete</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditThumbnailUrl('');
                        setFileName('');
                      }}
                      className="text-on-surface-variant hover:text-error transition cursor-pointer p-1"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Quyền riêng tư</label>
              <select 
                value={editVisibility} 
                onChange={e => setEditVisibility(e.target.value)} 
                className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white [&>option]:bg-surface"
              >
                <option value="public">Công khai / Public</option>
                <option value="private">Riêng tư / Private</option>
              </select>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setShowEditModal(false);
                  setShowDeleteConfirmModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs bg-error/10 hover:bg-error/20 text-error font-bold cursor-pointer"
              >
                Xóa Playlist
              </button>
              
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={loadingEdit}
                  className="px-4 py-2 rounded-xl text-xs electric-btn text-white font-bold cursor-pointer"
                >
                  {loadingEdit ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add Songs Modal Overlay */}
      {showAddSongsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4 max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Thêm bài hát vào playlist</h3>
              <button 
                onClick={() => {
                  setShowAddSongsModal(false);
                  setSongSearchQuery('');
                }}
                className="text-on-surface-variant hover:text-white cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              <input 
                type="text" 
                placeholder="Tìm bài hát theo tên hoặc nghệ sĩ..." 
                value={songSearchQuery} 
                onChange={e => setSongSearchQuery(e.target.value)} 
                className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition" 
              />
            </div>

            {/* Songs List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2 min-h-[250px] max-h-[350px]">
              {filteredSongs.length > 0 ? (
                filteredSongs.map(song => {
                  const isAdded = songs.some(s => s._id === song._id);
                  return (
                    <div key={song._id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>
                      <button 
                        disabled={isAdded}
                        onClick={() => handleAddSong(song)}
                        className={`h-8 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                          isAdded 
                            ? 'bg-white/5 text-on-surface-variant border border-white/5 cursor-not-allowed' 
                            : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">{isAdded ? 'check' : 'add'}</span>
                        <span>{isAdded ? 'Đã thêm' : 'Thêm'}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">music_note</span>
                  <p className="text-xs text-on-surface-variant">Không tìm thấy bài hát nào phù hợp</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-white/5">
              <button 
                onClick={() => {
                  setShowAddSongsModal(false);
                  setSongSearchQuery('');
                }}
                className="px-5 py-2.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer transition"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-status-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-sm font-bold text-white">Xóa danh sách phát?</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn xóa danh sách phát <strong>{playlist?.title}</strong>? Hành động này không thể hoàn tác và tất cả thông tin của danh sách phát sẽ bị gỡ bỏ.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white cursor-pointer font-bold transition"
              >
                Hủy
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.delete(`/playlists/${playlistId}`);
                    setShowDeleteConfirmModal(false);
                    navigate('/library-playlists');
                  } catch (err) {
                    alert('Xóa thất bại: ' + err.message);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs bg-status-error hover:bg-status-error/80 text-white font-bold cursor-pointer transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
