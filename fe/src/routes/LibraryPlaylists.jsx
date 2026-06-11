import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { api } from '../utils/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const LibraryPlaylists = () => {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const { user, toggleLikeSong } = useAuth();
  const { t } = useLanguage();
  
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Playlist Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('private');
  const [playlistImage, setPlaylistImage] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchLibraryData = async () => {
    try {
      const playlistsData = await api.get('/playlists');
      const songsData = await api.get('/songs');
      
      // Fetch public artists to find followed ones
      const artistsData = await api.get('/users/artists');
      const artists = (artistsData.artists || []).filter(u => 
        user?.following && user.following.includes(u._id)
      );

      const rawPlaylists = playlistsData.playlists || [];
      const sortedPlaylists = [...rawPlaylists].sort((a, b) => {
        const aLiked = user?.likedPlaylists?.includes(a._id);
        const bLiked = user?.likedPlaylists?.includes(b._id);
        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;
        return 0;
      });

      setPlaylists(sortedPlaylists);
      setSongs(songsData.songs || []);
      setFollowedArtists(artists);
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLibraryData();
    }
  }, [user]);

  const handlePlaySong = (song, list) => {
    play(song, list);
  };

  const handleUnlike = async (e, songId) => {
    e.stopPropagation();
    try {
      await toggleLikeSong(songId);
      // Refresh list
      fetchLibraryData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlaylistImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePlaylistSubmit = async (e) => {
    e.preventDefault();
    if (!playlistTitle.trim()) return;
    setCreating(true);
    try {
      await api.post('/playlists', {
        title: playlistTitle,
        description: playlistDesc,
        visibility: playlistVisibility,
        image: playlistImage
      });
      // Reset & Refresh
      setPlaylistTitle('');
      setPlaylistDesc('');
      setPlaylistImage('');
      setShowCreateModal(false);
      fetchLibraryData();
    } catch (err) {
      console.error(err);
      alert(t('Tạo playlist thất bại.'));
    } finally {
      setCreating(false);
    }
  };

  const likedSongs = songs.filter(s => user?.likedSongs && user.likedSongs.includes(s._id));

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pb-[120px] bg-background min-h-screen">
        <Header placeholder={t("Tìm kiếm trong thư viện...")} />

        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-64px)] text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>{t("Đang tải thư viện của bạn...")}</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-margin-page py-10">
            <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">{t("Thư viện của bạn")}</h2>
                <p className="text-on-surface-variant font-body-lg text-body-lg">{t("Quản lý các bản nhạc, danh sách phát và nghệ sĩ yêu thích.")}</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-on-primary font-label-md text-label-md py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xl"
              >
                <span className="material-symbols-outlined">add</span>
                {t("Tạo Playlist")}
              </button>
            </header>

            {/* Followed Artists Section */}
            <section className="mb-16">
              <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Nghệ sĩ đang theo dõi")}</h3>
              <div className="flex flex-wrap gap-6">
                {followedArtists.length > 0 ? (
                  followedArtists.map(artist => (
                    <div 
                      key={artist._id}
                      onClick={() => navigate(`/artist-detail?id=${artist._id}`)}
                      className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex items-center justify-center font-bold text-xs">
                        {artist.name[0].toUpperCase()}
                      </div>
                      <span className="font-label-md text-label-md text-white font-bold">{artist.name}</span>
                      <span className="inline-block text-[10px] bg-secondary/25 text-secondary px-2 py-0.5 rounded-full font-bold uppercase">Followed</span>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant/75 text-body-md">{t("Bạn chưa theo dõi nghệ sĩ nào.")}</p>
                )}
              </div>
            </section>

            {/* My Playlists list */}
            <section className="mb-16">
              <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Danh sách phát của tôi")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {playlists.length > 0 ? (
                  playlists.map(pl => (
                    <div 
                      key={pl._id}
                      onClick={() => navigate(`/playlist-detail?id=${pl._id}`)}
                      className="glass-panel rounded-2xl p-6 flex flex-col group relative overflow-hidden h-72 justify-between cursor-pointer hover:bg-white/10 transition-colors border border-white/5"
                    >
                      {pl.thumbnailUrl && (
                        <>
                          <img 
                            src={getFullUrl(pl.thumbnailUrl)} 
                            alt={pl.title} 
                            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-105 pointer-events-none" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0 pointer-events-none"></div>
                        </>
                      )}
                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <span className={`px-3 py-1 rounded-full text-label-sm font-label-sm border ${pl.visibility === 'public' ? 'bg-secondary/25 text-secondary border-secondary/30' : 'bg-surface-container-highest text-on-surface-variant border-white/5'}`}>
                          {pl.visibility === 'public' ? t('Công khai') : t('Riêng tư')}
                        </span>
                        <div className="flex items-center gap-2">
                          {user?.likedPlaylists?.includes(pl._id) && (
                            <span className="material-symbols-outlined text-primary select-none" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          )}
                          <span className="material-symbols-outlined text-on-surface-variant select-none">
                            {pl.visibility === 'public' ? 'public' : 'lock'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative z-10 mt-auto">
                        <h4 className="font-headline-md text-headline-md text-white mb-1 font-bold truncate">{pl.title}</h4>
                        <p className="text-on-surface-variant font-label-md text-label-md mb-2 truncate">{pl.description || t('Không có mô tả')}</p>
                        <p className="text-on-surface-variant text-[11px] font-semibold">{pl.songs?.length || 0} {t('bài hát')}</p>
                      </div>

                      {pl.songs && pl.songs.length > 0 && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={(e) => { e.stopPropagation(); play(pl.songs[0], pl.songs); }}
                            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 glass-panel p-8 rounded-2xl text-center border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-3">playlist_play</span>
                    <p className="text-on-surface-variant font-body-md mb-4">{t("Bạn chưa tạo danh sách phát nào.")}</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 rounded-full bg-primary text-on-primary font-bold hover:brightness-110 cursor-pointer"
                    >
                      {t("Tạo ngay playlist đầu tiên")}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Liked songs list */}
            <section className="mb-10">
              <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Bài hát yêu thích")}</h3>
              <div className="glass-panel rounded-3xl p-6 border border-white/5 overflow-hidden">
                {likedSongs.length > 0 ? (
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-white/5">
                        <th className="px-6 py-4 font-normal">{t("# Tiêu đề")}</th>
                        <th className="px-6 py-4 font-normal">{t("Thể loại")}</th>
                        <th className="px-6 py-4 font-normal text-right">{t("Thao tác")}</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-4">
                      {likedSongs.map((song, i) => (
                        <tr 
                          key={song._id}
                          onClick={() => handlePlaySong(song, likedSongs)}
                          className="group hover:bg-white/5 transition-colors cursor-pointer rounded-xl"
                        >
                          <td className="px-6 py-4 first:rounded-l-xl">
                            <div className="flex items-center gap-4">
                              <span className="w-4 text-on-surface-variant font-label-md text-label-md group-hover:hidden font-bold">
                                {i + 1}
                              </span>
                              <span className="w-4 text-primary group-hover:inline-block hidden material-symbols-outlined">
                                play_arrow
                              </span>
                              <img className="w-12 h-12 rounded-lg object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                              <div className="min-w-0 overflow-hidden">
                                <p className="font-label-md text-label-md text-white group-hover:text-primary transition-colors font-bold truncate">
                                  {song.title}
                                </p>
                                <p 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (song.artistId) navigate(`/artist-detail?id=${song.artistId}`);
                                  }}
                                  className="font-label-sm text-label-sm text-on-surface-variant truncate hover:text-primary transition-colors cursor-pointer"
                                >
                                  {song.artist}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                            {song.genre}
                          </td>
                          <td className="px-6 py-4 last:rounded-r-xl text-right">
                            <div className="flex items-center justify-end gap-4">
                              <button 
                                onClick={(e) => handleUnlike(e, song._id)}
                                className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform" 
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                favorite
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl mb-3">favorite_border</span>
                    <p className="font-body-md">{t("Không có bài hát yêu thích nào.")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Playlist Creation Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Tạo Playlist Mới")}</h3>
            
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">{t("Tên Playlist")}</label>
                <input 
                  type="text" 
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none"
                  placeholder={t("Nhập tên playlist...")}
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">{t("Mô tả")}</label>
                <textarea 
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none resize-none"
                  placeholder={t("Nhập mô tả ngắn...")}
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">{t("Quyền truy cập")}</label>
                <select 
                  value={playlistVisibility}
                  onChange={(e) => setPlaylistVisibility(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none"
                >
                  <option value="private">{t("Riêng tư")}</option>
                  <option value="public">{t("Công khai")}</option>
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">{t("Ảnh bìa (Tùy chọn)")}</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-label-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-label-sm file:font-semibold file:bg-primary/20 file:text-primary file:cursor-pointer hover:file:bg-primary/30"
                />
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer flex justify-center items-center mt-6"
              >
                {creating ? t('Đang tạo...') : t('Tạo Playlist')}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      <MusicPlayer />
    </>
  );
};

export default LibraryPlaylists;
