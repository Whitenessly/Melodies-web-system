import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { play } = usePlayer();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [filter, setFilter] = useState('all'); // 'all' | 'songs' | 'artists' | 'albums'
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Fetch matching songs
      const songsData = await api.get(`/songs?search=${encodeURIComponent(searchQuery)}`);
      setSongs(songsData.songs || []);

      // 2. Fetch matching albums
      const albumsData = await api.get(`/albums?search=${encodeURIComponent(searchQuery)}`);
      setAlbums(albumsData.albums || []);

      // 3. Fetch public artists matching search name
      const artistsData = await api.get('/users/artists');
      const filteredArtists = (artistsData.artists || []).filter(u => 
        searchQuery === '' || u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setArtists(filteredArtists);
    } catch (err) {
      console.error('Failed to execute search:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchQuery]);

  const handlePlaySong = (song, list) => {
    play(song, list);
  };

  const handleFollowToggle = async (e, artistId) => {
    e.stopPropagation();
    try {
      await api.post('/users/follow', { artistId });
      // Refresh
      fetchResults();
      // Wait, we also want user profile updated to reflect the new following list!
      // In AuthContext, profile will update automatically on refresh, but let's refresh page or reload profile if needed.
    } catch (err) {
      console.error(err);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const topResult = artists.length > 0 ? artists[0] : (songs.length > 0 ? songs[0] : null);

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width min-h-screen pb-[120px] bg-background">
        <Header placeholder={t("Bạn muốn nghe gì?")} />

        <div className="p-margin-page">
          {/* Query label */}
          <div className="mb-6">
            <h2 className="text-on-surface-variant font-label-md text-label-md">
              {t("Kết quả tìm kiếm cho:")} <span className="text-white font-bold text-lg">"{searchQuery || t('Tất cả')}"</span>
            </h2>
          </div>

          {/* Filters tags list */}
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'all' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Tất cả")}
            </button>
            <button 
              onClick={() => setFilter('songs')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'songs' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Bài hát")}
            </button>
            <button 
              onClick={() => setFilter('artists')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'artists' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Nghệ sĩ")}
            </button>
            <button 
              onClick={() => setFilter('albums')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'albums' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Album")}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-primary">
              <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
              <span>{t("Đang tìm kiếm...")}</span>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Top Result & Songs split (visible when filter is all) */}
              {filter === 'all' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Top Result box */}
                  <section className="lg:col-span-5 space-y-6">
                    <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Kết quả hàng đầu")}</h2>
                    {topResult ? (
                      <div 
                        onClick={() => {
                          if (topResult.role === 'artist') {
                            navigate(`/artist-detail?id=${topResult._id}`);
                          } else if (topResult.audioUrl) {
                            handlePlaySong(topResult, songs);
                          }
                        }}
                        className="relative group cursor-pointer overflow-hidden rounded-3xl h-[360px] glass-panel p-8 flex flex-col justify-end transition-all hover:border-primary/30 border border-white/5"
                      >
                        <div className="absolute inset-0 z-0">
                          <img 
                            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" 
                            src={getFullUrl(topResult.thumbnailUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVXwcIBNVwUFhNOV0aA-z5hp5gQzipMR6enFlyvOPcVO3ZjRYqNFlk3HBvmvxh_-1MjHN5wYFZOkm3KQxPZrRdUklSdhPaqzHtQ_hL17uhv0TqUKOWVeVBFY_Y8aXoHQrU_L6k7V6IeEGB4fXPAOEfb4h4ijwtu5o_phEaRM--vGsLm9OE1dXyH2CZOyFo0ioZe01-aWd34zayBrP1-eOfK09CdeersTAmDe2UIDBRU8SLEhbdvD35bmkMQDM2d3qlPd2b2V6ydjM')} 
                            alt={topResult.name || topResult.title} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                        </div>
                        <div className="relative z-10">
                          {topResult.audioUrl && (
                            <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                            </div>
                          )}
                          <h3 className="font-headline-xl text-headline-xl text-white mb-2 font-bold truncate">
                            {topResult.name || topResult.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-label-sm font-bold tracking-widest uppercase">
                              {topResult.role ? t('Nghệ sĩ') : t('Bài hát')}
                            </span>
                            {topResult.email && (
                              <span className="text-on-surface-variant font-label-md">{topResult.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-on-surface-variant">{t("Không tìm thấy kết quả phù hợp")}</p>
                    )}
                  </section>

                  {/* Songs list */}
                  <section className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Bài hát")}</h2>
                    </div>
                    <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/5 max-h-[360px] overflow-y-auto custom-scrollbar">
                      {songs.slice(0, 5).map(song => (
                        <div 
                          key={song._id}
                          onClick={() => handlePlaySong(song, songs)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-white font-body-md group-hover:text-primary transition-colors font-bold truncate">{song.title}</h4>
                              <p 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (song.artistId) navigate(`/artist-detail?id=${song.artistId}`);
                                }}
                                className="text-on-surface-variant text-label-sm truncate hover:text-primary transition-colors cursor-pointer"
                              >
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <span className="inline-block text-[10px] bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-bold">
                            {song.genre}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* Filtering sections */}
              {(filter === 'all' || filter === 'songs') && songs.length > 0 && filter !== 'all' && (
                <section className="space-y-6">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Bài hát khớp tìm kiếm")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {songs.map(song => (
                      <div 
                        key={song._id}
                        onClick={() => handlePlaySong(song, songs)}
                        className="glass-panel p-4 rounded-2xl flex gap-4 items-center group cursor-pointer hover:bg-white/10 transition-all border border-white/5"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          </div>
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <h5 className="font-label-md text-label-md text-white truncate font-bold">{song.title}</h5>
                          <p 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (song.artistId) navigate(`/artist-detail?id=${song.artistId}`);
                             }}
                             className="font-label-sm text-label-sm text-on-surface-variant truncate hover:text-primary transition-colors cursor-pointer"
                           >
                             {song.artist}
                           </p>
                          <span className="inline-block text-[10px] text-secondary mt-1 bg-secondary/15 px-2 py-0.5 rounded-full font-bold">
                            {song.genre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(filter === 'all' || filter === 'artists') && artists.length > 0 && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Nghệ sĩ liên quan")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {artists.map(artist => {
                      const followingList = user?.following || [];
                      const followed = followingList.includes(artist._id);
                      return (
                        <div 
                          key={artist._id}
                          onClick={() => navigate(`/artist-detail?id=${artist._id}`)}
                          className="flex flex-col items-center gap-4 group cursor-pointer bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-center"
                        >
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary/50 transition-all relative shadow-lg">
                            <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary text-3xl font-bold">
                              {artist.name[0].toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white font-body-md font-bold group-hover:text-primary transition-colors">{artist.name}</h4>
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold mt-1">{t("Nghệ sĩ")}</p>
                          </div>
                          
                          <button 
                            onClick={(e) => handleFollowToggle(e, artist._id)}
                            className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold border transition-all cursor-pointer ${followed ? 'bg-primary/25 text-primary border-primary/40' : 'bg-primary text-on-primary border-transparent hover:scale-105'}`}
                          >
                            {followed ? t('Đang Follow') : t('Follow')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {(filter === 'all' || filter === 'albums') && albums.length > 0 && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Album")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                    {albums.map(album => (
                      <div 
                        key={album._id}
                        className="group cursor-pointer bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl mb-4 shadow-lg">
                          <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={getFullUrl(album.thumbnailUrl)} alt={album.title} />
                          {album.songs && album.songs.length > 0 && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div 
                                onClick={(e) => { e.stopPropagation(); play(album.songs[0], album.songs); }}
                                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xl cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <h4 className="text-white font-body-md font-bold truncate group-hover:text-primary transition-colors">{album.title}</h4>
                        <p className="text-on-surface-variant text-label-md">{album.artist} • {album.genre}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* No results notice */}
              {!topResult && (
                <div className="text-center py-24 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                  <p className="font-body-lg">{t("Không tìm thấy bất kỳ kết quả nào khớp với")} "{searchQuery}"</p>
                  <p className="text-label-md mt-1">{t("Hãy thử kiểm tra lỗi chính tả hoặc tìm kiếm bằng từ khóa khác.")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <MusicPlayer />
    </>
  );
};

export default SearchResults;
