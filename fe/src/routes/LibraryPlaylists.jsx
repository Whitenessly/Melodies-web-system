import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function LibraryPlaylists() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [playlists, setPlaylists] = useState([]);
  const [likedSongsCount, setLikedSongsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Creation modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  // File upload states
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
          setThumbnailUrl(reader.result);
        }
      }, 100);
    };
    reader.readAsDataURL(file);
  };

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
        visibility,
        thumbnailUrl
      });
      setPlaylists(prev => [...prev, newPlaylist]);
      setShowModal(false);
      setTitle('');
      setDesc('');
      setThumbnailUrl('');
      setFileName('');
      setUploadProgress(0);
      setUploading(false);
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
                {t('music_library')}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5">
                {t('library_subtitle')}
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="electric-btn text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-102 transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-base">add_box</span>
              {t('create_playlist')}
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
                  <h3 className="font-display-lg text-lg font-bold text-white uppercase tracking-wider">{t('liked_songs')}</h3>
                  <p className="text-xs text-white/70 mt-1">{t('liked_songs_desc')}</p>
                </div>
                <p className="text-xs font-extrabold text-white">{likedSongsCount} {t('songs_count')}</p>
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
                    <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">{playlist.description || t('no_description')}</p>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant mt-auto">{playlist.songs?.length || 0} {t('songs')} • {t(playlist.visibility)}</p>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />

      {/* Creation modal overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <form onSubmit={handleCreatePlaylist} className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">{t('create_playlist')}</h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">{t('playlist_name')}</label>
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
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">{t('short_description')}</label>
              <input 
                type="text" 
                placeholder={t('playlist_desc_placeholder')} 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
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
                {thumbnailUrl && !uploading && (
                  <div className="flex items-center gap-3 mt-1 p-2 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                    <img 
                      src={thumbnailUrl} 
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
                        setThumbnailUrl('');
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
              <label className="text-[9px] uppercase font-bold text-on-surface-variant">{t('privacy')}</label>
              <select 
                value={visibility} 
                onChange={e => setVisibility(e.target.value)} 
                className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white [&>option]:bg-surface"
              >
                <option value="public">{t('public')}</option>
                <option value="private">{t('private')}</option>
              </select>
            </div>

            <div className="flex justify-end mt-3 pt-3 border-t border-white/5 gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white cursor-pointer">{t('cancel')}</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs electric-btn text-white font-bold cursor-pointer">{t('create')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
