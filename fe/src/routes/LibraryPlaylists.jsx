import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';

export default function LibraryPlaylists() {
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [likedSongsCount, setLikedSongsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Creation modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('public');

  const loadLibrary = async () => {
    try {
      const [playlistsData, likedSongs] = await Promise.all([
        api.get('/playlists/my'),
        api.get('/users/liked-songs')
      ]);
      setPlaylists(playlistsData);
      setLikedSongsCount(likedSongs.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const newPlaylist = await api.post('/playlists', {
        title,
        description: desc,
        visibility
      });
      setPlaylists(prev => [...prev, newPlaylist]);
      setShowModal(false);
      setTitle('');
      setDesc('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container">library_music</span>
                Thư viện Âm nhạc
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Nơi lưu giữ các danh sách phát cá nhân của bạn và danh sách các bài hát yêu thích.
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="electric-btn text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-102 transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-base">add_box</span>
              Tạo Playlist mới
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Liked Songs Special Bento card */}
              <div 
                onClick={() => navigate('/playlist-detail?id=liked')}
                className="p-6 rounded-3xl bg-gradient-to-br from-[#8A3FFC] to-[#2E5BFF] flex flex-col justify-between cursor-pointer hover:scale-102 transition shadow-xl min-h-[180px] relative overflow-hidden group"
              >
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-15 group-hover:scale-110 transition">favorite</span>
                <div>
                  <h3 className="font-display-lg text-lg font-bold text-white uppercase tracking-wider">Bài hát Đã thích</h3>
                  <p className="text-xs text-white/70 mt-1">Danh sách lưu trữ các bài hát tâm đắc nhất của bạn.</p>
                </div>
                <p className="text-xs font-extrabold text-white">{likedSongsCount} Bài hát</p>
              </div>

              {/* User Playlists list */}
              {playlists.map(playlist => (
                <div 
                  key={playlist._id}
                  onClick={() => navigate(`/playlist-detail?id=${playlist._id}`)}
                  className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-4 cursor-pointer hover:scale-102 transition shadow-lg min-h-[180px] group"
                >
                  <img 
                    src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120'} 
                    alt="" 
                    className="w-12 h-12 rounded-xl object-cover border border-white/5" 
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-secondary-container transition line-clamp-1">{playlist.title}</h3>
                    <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">{playlist.description || 'Không có mô tả'}</p>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant mt-auto">{playlist.songs?.length || 0} bài hát • {playlist.visibility}</p>
                </div>
              ))}
            </div>
          )}

          {/* Creation modal overlay */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <form onSubmit={handleCreatePlaylist} className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white">Tạo Playlist mới</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-on-surface-variant">Tên Playlist</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="My Playlist" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-on-surface-variant">Mô tả ngắn</label>
                  <input 
                    type="text" 
                    placeholder="Mô tả danh sách phát của bạn..." 
                    value={desc} 
                    onChange={e => setDesc(e.target.value)} 
                    className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-on-surface-variant">Quyền riêng tư</label>
                  <select 
                    value={visibility} 
                    onChange={e => setVisibility(e.target.value)} 
                    className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white [&>option]:bg-surface"
                  >
                    <option value="public">Công khai / Public</option>
                    <option value="private">Riêng tư / Private</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end mt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-xs electric-btn text-white font-bold">Tạo mới</button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
