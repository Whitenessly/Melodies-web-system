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
                <span className="material-symbols-outlined text-primary">library_music</span>
                {t('music_library')}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                {t('library_subtitle')}
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-5 py-2.5 rounded-full hover:scale-105 transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-base font-bold">add</span>
              {t('create_playlist')}
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Liked Songs Special Bento card */}
              <div 
                onClick={() => navigate('/playlist-detail?id=liked')}
                className="col-span-2 sm:col-span-1 p-5 md:p-6 rounded-2xl bg-gradient-to-br from-tertiary to-primary/60 flex flex-col justify-between cursor-pointer hover:scale-105 hover:-translate-y-1 transition duration-300 shadow-xl min-h-[160px] md:min-h-[200px] relative overflow-hidden group border border-white/5"
              >
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl md:text-9xl opacity-20 group-hover:scale-110 transition duration-300">favorite</span>
                <div>
                  <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider text-white bg-white/20 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full backdrop-blur-sm self-start">Special Collection</span>
                  <h3 className="font-display-lg text-lg md:text-xl font-bold text-white uppercase tracking-wider mt-3 md:mt-4">{t('liked_songs')}</h3>
                  <p className="text-xs text-white/85 mt-1 md:mt-2 font-medium">{t('liked_songs_desc')}</p>
                </div>
                <p className="text-xs font-extrabold text-white mt-2">{likedSongsCount} {t('songs_count')}</p>
              </div>

              {/* User Playlists list */}
              {playlists.map(playlist => (
                <div 
                  key={playlist._id}
                  onClick={() => navigate(`/playlist-detail?id=${playlist._id}`)}
                  className="music-grid-card group flex flex-col min-h-[220px]"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-white/5 mb-4 relative shadow-md">
                    <img 
                      src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=250'} 
                      alt="" 
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition line-clamp-1 duration-150">{playlist.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 font-medium">{playlist.description || t('no_description')}</p>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    <span>{playlist.songs?.length || 0} {t('songs')}</span>
                    <span className="uppercase text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded">{t(playlist.visibility)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />

      {/* Creation modal overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
          <form onSubmit={handleCreatePlaylist} className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">{t('create_playlist')}</h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer transition duration-150"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant ml-1">{t('playlist_name')}</label>
              <input 
                type="text" 
                required 
                placeholder="My Playlist" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full h-11 px-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant ml-1">{t('short_description')}</label>
              <input 
                type="text" 
                placeholder={t('playlist_desc_placeholder')} 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className="w-full h-11 px-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white placeholder-on-surface-variant transition duration-200" 
              />
            </div>

            {/* Cover Image Upload (Image instead of URL) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant ml-1">Ảnh đại diện Playlist</label>
              <div className="flex flex-col gap-3 p-4 bg-[#121212] border border-white/5 rounded-2xl">
                <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold cursor-pointer transition duration-200 select-none self-start">
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
                        className="h-full bg-primary transition-all duration-100" 
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
                      <p className="text-[9px] text-primary font-extrabold uppercase tracking-wider mt-0.5">Upload complete</p>
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-on-surface-variant ml-1">{t('privacy')}</label>
              <select 
                value={visibility} 
                onChange={e => setVisibility(e.target.value)} 
                className="w-full h-11 px-4 bg-[#121212] border border-white/5 focus:border-primary rounded-xl text-xs text-white [&>option]:bg-surface transition duration-200 cursor-pointer"
              >
                <option value="public">{t('public')}</option>
                <option value="private">{t('private')}</option>
              </select>
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-white/5 gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-white cursor-pointer font-bold transition duration-150">{t('cancel')}</button>
              <button type="submit" className="px-6 py-2.5 rounded-full text-xs bg-primary text-black font-bold cursor-pointer hover:scale-105 active:scale-95 transition duration-150">{t('create')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
