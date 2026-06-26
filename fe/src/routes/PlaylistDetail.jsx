import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { api } from '../utils/api.js';

export default function PlaylistDetail() {
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const playlistId = searchParams.get('id');

  const loadPlaylistDetails = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      if (playlistId === 'liked') {
        // Mock playlist header for Liked Songs
        setPlaylist({
          title: 'Bài hát Đã thích',
          description: 'Tuyển tập tất cả các tác phẩm bạn đã bấm yêu thích.',
          thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          visibility: 'private',
          isLikedSpecial: true
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
            <p>Không tìm thấy danh sách phát.</p>
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
          {/* Cover Header */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-10 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${playlist.thumbnailUrl})` }}
            />
            
            <img 
              src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300'} 
              alt="" 
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border border-white/10 relative z-10" 
            />

            <div className="relative z-10 flex-1 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-white/5 border border-white/10 rounded text-on-surface-variant w-max mx-auto md:mx-0">
                {playlist.visibility}
              </span>
              <h1 className="font-display-lg text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-2">{playlist.title}</h1>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{playlist.description}</p>
            </div>
          </div>

          {/* Songs List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">playlist_play</span>
              Danh sách bài hát ({songs.length})
            </h2>

            {songs.length > 0 ? (
              <div className="glass-panel p-4 rounded-2xl flex flex-col divide-y divide-white/5">
                {songs.map((song, idx) => (
                  <div 
                    key={song._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div 
                      onClick={() => playSong(song, songs, idx)}
                      className="flex items-center gap-4 min-w-0 flex-1"
                    >
                      <span className="text-xs font-semibold text-on-surface-variant min-w-[20px]">{idx + 1}</span>
                      <img src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-secondary-container transition truncate">{song.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                      <button 
                        onClick={() => handleRemoveTrack(song._id)}
                        className="text-on-surface-variant hover:text-error transition p-1.5 hover:bg-white/5 rounded-lg"
                        title="Xóa bài"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center rounded-2xl">
                <p className="text-xs text-on-surface-variant">Không có bài hát nào trong playlist này.</p>
              </div>
            )}
          </div>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
