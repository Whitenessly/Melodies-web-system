import { useEffect, useState } from 'react';
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
  const { user, toggleFollowArtist } = useAuth();
  const { t } = useLanguage();
  
  const [filter, setFilter] = useState('all'); // 'all' | 'songs' | 'artists' | 'albums'
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Songs pagination state
  const [paginatedSongs, setPaginatedSongs] = useState([]);
  const [songsPage, setSongsPage] = useState(1);
  const [songsTotalPages, setSongsTotalPages] = useState(1);
  const [songsTotal, setSongsTotal] = useState(0);
  const [songsLoading, setSongsLoading] = useState(false);
  const songsLimit = 10;

  // Artists pagination state
  const [paginatedArtists, setPaginatedArtists] = useState([]);
  const [artistsPage, setArtistsPage] = useState(1);
  const [artistsTotalPages, setArtistsTotalPages] = useState(1);
  const [artistsTotal, setArtistsTotal] = useState(0);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const artistsLimit = 10;

  // Albums pagination state
  const [paginatedAlbums, setPaginatedAlbums] = useState([]);
  const [albumsPage, setAlbumsPage] = useState(1);
  const [albumsTotalPages, setAlbumsTotalPages] = useState(1);
  const [albumsTotal, setAlbumsTotal] = useState(0);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const albumsLimit = 10;

  // Extract query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      // Yield to avoid setState synchronously inside useEffect
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setSongsPage(1);
      setArtistsPage(1);
      setAlbumsPage(1);

      try {
        // 1. Fetch matching songs
        const songsData = await api.get(`/songs?search=${encodeURIComponent(searchQuery)}`);
        if (!active) return;
        setSongs(songsData.songs || []);

        // 2. Fetch matching albums
        const albumsData = await api.get(`/albums?search=${encodeURIComponent(searchQuery)}`);
        if (!active) return;
        setAlbums(albumsData.albums || []);

        // 3. Fetch public artists matching search name
        const artistsData = await api.get(`/users/artists?search=${encodeURIComponent(searchQuery)}`);
        if (!active) return;
        setArtists(artistsData.artists || []);
      } catch (err) {
        console.error('Failed to execute search:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [searchQuery]);

  // Fetch paginated songs when active filter is 'songs' or page changes
  useEffect(() => {
    if (filter !== 'songs') return;

    let active = true;
    const fetchPaginatedSongs = async () => {
      setSongsLoading(true);
      try {
        const response = await api.get(
          `/songs?search=${encodeURIComponent(searchQuery)}&page=${songsPage}&limit=${songsLimit}`
        );
        if (!active) return;
        setPaginatedSongs(response.songs || []);
        if (response.pagination) {
          setSongsTotalPages(response.pagination.pages || 1);
          setSongsTotal(response.pagination.total || 0);
        } else {
          setSongsTotalPages(1);
          setSongsTotal(response.songs?.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch paginated songs:', err);
      } finally {
        if (active) {
          setSongsLoading(false);
        }
      }
    };

    fetchPaginatedSongs();

    return () => {
      active = false;
    };
  }, [searchQuery, filter, songsPage]);

  // Fetch paginated artists when active filter is 'artists' or page changes
  useEffect(() => {
    if (filter !== 'artists') return;

    let active = true;
    const fetchPaginatedArtists = async () => {
      setArtistsLoading(true);
      try {
        const response = await api.get(
          `/users/artists?search=${encodeURIComponent(searchQuery)}&page=${artistsPage}&limit=${artistsLimit}`
        );
        if (!active) return;
        setPaginatedArtists(response.artists || []);
        if (response.pagination) {
          setArtistsTotalPages(response.pagination.pages || 1);
          setArtistsTotal(response.pagination.total || 0);
        } else {
          setArtistsTotalPages(1);
          setArtistsTotal(response.artists?.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch paginated artists:', err);
      } finally {
        if (active) {
          setArtistsLoading(false);
        }
      }
    };

    fetchPaginatedArtists();

    return () => {
      active = false;
    };
  }, [searchQuery, filter, artistsPage]);

  // Fetch paginated albums when active filter is 'albums' or page changes
  useEffect(() => {
    if (filter !== 'albums') return;

    let active = true;
    const fetchPaginatedAlbums = async () => {
      setAlbumsLoading(true);
      try {
        const response = await api.get(
          `/albums?search=${encodeURIComponent(searchQuery)}&page=${albumsPage}&limit=${albumsLimit}`
        );
        if (!active) return;
        setPaginatedAlbums(response.albums || []);
        if (response.pagination) {
          setAlbumsTotalPages(response.pagination.pages || 1);
          setAlbumsTotal(response.pagination.total || 0);
        } else {
          setAlbumsTotalPages(1);
          setAlbumsTotal(response.albums?.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch paginated albums:', err);
      } finally {
        if (active) {
          setAlbumsLoading(false);
        }
      }
    };

    fetchPaginatedAlbums();

    return () => {
      active = false;
    };
  }, [searchQuery, filter, albumsPage]);

  const handlePlaySong = (song, list) => {
    play(song, list);
  };

  const handleFollowToggle = async (e, artistId) => {
    e.stopPropagation();
    try {
      await toggleFollowArtist(artistId);
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const handleSetFilter = (newFilter) => {
    setFilter(newFilter);
    setSongsPage(1);
    setArtistsPage(1);
    setAlbumsPage(1);
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
              onClick={() => handleSetFilter('all')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'all' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Tất cả")}
            </button>
            <button 
              onClick={() => handleSetFilter('songs')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'songs' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Bài hát")}
            </button>
            <button 
              onClick={() => handleSetFilter('artists')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap cursor-pointer transition-all ${filter === 'artists' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-highest/50 text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              {t("Nghệ sĩ")}
            </button>
            <button 
              onClick={() => handleSetFilter('albums')}
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
                            src={getFullUrl(
                              topResult.role === 'artist'
                                ? (topResult.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVXwcIBNVwUFhNOV0aA-z5hp5gQzipMR6enFlyvOPcVO3ZjRYqNFlk3HBvmvxh_-1MjHN5wYFZOkm3KQxPZrRdUklSdhPaqzHtQ_hL17uhv0TqUKOWVeVBFY_Y8aXoHQrU_L6k7V6IeEGB4fXPAOEfb4h4ijwtu5o_phEaRM--vGsLm9OE1dXyH2CZOyFo0ioZe01-aWd34zayBrP1-eOfK09CdeersTAmDe2UIDBRU8SLEhbdvD35bmkMQDM2d3qlPd2b2V6ydjM')
                                : (topResult.thumbnailUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVXwcIBNVwUFhNOV0aA-z5hp5gQzipMR6enFlyvOPcVO3ZjRYqNFlk3HBvmvxh_-1MjHN5wYFZOkm3KQxPZrRdUklSdhPaqzHtQ_hL17uhv0TqUKOWVeVBFY_Y8aXoHQrU_L6k7V6IeEGB4fXPAOEfb4h4ijwtu5o_phEaRM--vGsLm9OE1dXyH2CZOyFo0ioZe01-aWd34zayBrP1-eOfK09CdeersTAmDe2UIDBRU8SLEhbdvD35bmkMQDM2d3qlPd2b2V6ydjM')
                            )} 
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
                    <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/5 h-[360px] overflow-y-auto custom-scrollbar">
                      {songs.slice(0, 10).map(song => (
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
                      {songs.length > 10 && (
                        <div 
                          onClick={() => {
                            handleSetFilter('songs');
                          }}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border-t border-white/5 mt-1"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all">
                              <span className="material-symbols-outlined text-white/70 group-hover:text-primary transition-colors">more_horiz</span>
                            </div>
                            <div>
                              <h4 className="text-white/80 font-body-md group-hover:text-primary transition-colors font-bold truncate">
                                {t("Xem thêm")}
                              </h4>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors pr-2">arrow_forward</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {filter === 'songs' && (
                <section className="space-y-6">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Bài hát khớp tìm kiếm")}</h2>
                  
                  {songsLoading ? (
                    <div className="flex items-center justify-center py-20 text-primary">
                      <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
                      <span>{t("Đang tìm kiếm...")}</span>
                    </div>
                  ) : paginatedSongs.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedSongs.map(song => (
                          <div 
                            key={song._id}
                            onClick={() => handlePlaySong(song, paginatedSongs)}
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

                      {/* Pagination Controls */}
                      {songsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                          <button
                            disabled={songsPage <= 1}
                            onClick={() => setSongsPage(prev => Math.max(prev - 1, 1))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              songsPage <= 1 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_before</span>
                          </button>

                          {Array.from({ length: songsTotalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setSongsPage(page)}
                              className={`w-10 h-10 rounded-full font-bold transition-all cursor-pointer ${
                                songsPage === page
                                  ? 'bg-primary text-on-primary shadow-lg'
                                  : 'border border-white/10 hover:bg-white/5 text-white active:scale-95'
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            disabled={songsPage >= songsTotalPages}
                            onClick={() => setSongsPage(prev => Math.min(prev + 1, songsTotalPages))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              songsPage >= songsTotalPages 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_next</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl mb-2">music_off</span>
                      <p className="font-body-md">{t("Chưa tìm thấy bài hát nào phù hợp.")}</p>
                    </div>
                  )}
                </section>
              )}

              {filter === 'all' && artists.length > 0 && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Nghệ sĩ liên quan")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {(artists.length > 5 ? artists.slice(0, 4) : artists).map(artist => {
                      const followingList = user?.following || [];
                      const followed = followingList.includes(artist._id);
                      return (
                        <div 
                          key={artist._id}
                          onClick={() => navigate(`/artist-detail?id=${artist._id}`)}
                          className="flex flex-col items-center gap-4 group cursor-pointer bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-center"
                        >
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary/50 transition-all relative shadow-lg">
                            {artist.avatarUrl ? (
                              <img className="w-full h-full object-cover" src={getFullUrl(artist.avatarUrl)} alt={artist.name} />
                            ) : (
                              <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary text-3xl font-bold">
                                {artist.name[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-white font-body-md font-bold group-hover:text-primary transition-colors">{artist.name}</h4>
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold mt-1">{t("Nghệ sĩ")}</p>
                          </div>
                          
                          <button 
                            onClick={(e) => handleFollowToggle(e, artist._id)}
                            className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold border transition-all active:scale-95 cursor-pointer ${
                              followed 
                                ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                                : 'border-white/20 hover:border-white/50 text-white'
                            }`}
                          >
                            {followed ? t('ĐANG THEO DÕI') : t('THEO DÕI')}
                          </button>
                        </div>
                      );
                    })}
                    {artists.length > 5 && (
                      <div 
                        onClick={() => {
                          handleSetFilter('artists');
                        }}
                        className="flex flex-col items-center justify-center gap-4 group cursor-pointer bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all text-center h-full min-h-[250px]"
                      >
                        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-lg">
                          <span className="material-symbols-outlined text-white/50 text-4xl group-hover:text-primary transition-colors">navigate_next</span>
                        </div>
                        <div>
                          <h4 className="text-white font-body-md font-bold group-hover:text-primary transition-colors">{t("Xem thêm")}</h4>
                          <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold mt-1">{t("Nghệ sĩ")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {filter === 'artists' && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Nghệ sĩ liên quan")}</h2>
                  
                  {artistsLoading ? (
                    <div className="flex items-center justify-center py-20 text-primary">
                      <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
                      <span>{t("Đang tìm kiếm...")}</span>
                    </div>
                  ) : paginatedArtists.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {paginatedArtists.map(artist => {
                          const followingList = user?.following || [];
                          const followed = followingList.includes(artist._id);
                          return (
                            <div 
                              key={artist._id}
                              onClick={() => navigate(`/artist-detail?id=${artist._id}`)}
                              className="flex flex-col items-center gap-4 group cursor-pointer bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-center"
                            >
                              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary/50 transition-all relative shadow-lg">
                                {artist.avatarUrl ? (
                                  <img className="w-full h-full object-cover" src={getFullUrl(artist.avatarUrl)} alt={artist.name} />
                                ) : (
                                  <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary text-3xl font-bold">
                                    {artist.name[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-white font-body-md font-bold group-hover:text-primary transition-colors">{artist.name}</h4>
                                <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold mt-1">{t("Nghệ sĩ")}</p>
                              </div>
                              
                              <button 
                                onClick={(e) => handleFollowToggle(e, artist._id)}
                                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold border transition-all active:scale-95 cursor-pointer ${
                                  followed 
                                    ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                                    : 'border-white/20 hover:border-white/50 text-white'
                                }`}
                              >
                                {followed ? t('ĐANG THEO DÕI') : t('THEO DÕI')}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {artistsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                          <button
                            disabled={artistsPage <= 1}
                            onClick={() => setArtistsPage(prev => Math.max(prev - 1, 1))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              artistsPage <= 1 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_before</span>
                          </button>

                          {Array.from({ length: artistsTotalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setArtistsPage(page)}
                              className={`w-10 h-10 rounded-full font-bold transition-all cursor-pointer ${
                                artistsPage === page
                                  ? 'bg-primary text-on-primary shadow-lg'
                                  : 'border border-white/10 hover:bg-white/5 text-white active:scale-95'
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            disabled={artistsPage >= artistsTotalPages}
                            onClick={() => setArtistsPage(prev => Math.min(prev + 1, artistsTotalPages))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              artistsPage >= artistsTotalPages 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_next</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl mb-2">person_off</span>
                      <p className="font-body-md">{t("Chưa tìm thấy nghệ sĩ nào phù hợp.")}</p>
                    </div>
                  )}
                </section>
              )}

              {filter === 'all' && albums.length > 0 && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Album")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                    {(albums.length > 5 ? albums.slice(0, 4) : albums).map(album => (
                      <div 
                        key={album._id}
                        onClick={() => navigate(`/playlist-detail?id=${album._id}`)}
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
                    {albums.length > 5 && (
                      <div 
                        onClick={() => {
                          handleSetFilter('albums');
                        }}
                        className="group cursor-pointer bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-primary/20 transition-all flex flex-col justify-between h-full min-h-[200px]"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl mb-4 bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-lg">
                          <span className="material-symbols-outlined text-white/50 text-4xl group-hover:text-primary transition-colors">navigate_next</span>
                        </div>
                        <div>
                          <h4 className="text-white font-body-md font-bold truncate group-hover:text-primary transition-colors">{t("Xem thêm")}</h4>
                          <p className="text-on-surface-variant text-label-md">{t("Album")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {filter === 'albums' && (
                <section className="space-y-8">
                  <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Album")}</h2>
                  
                  {albumsLoading ? (
                    <div className="flex items-center justify-center py-20 text-primary">
                      <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
                      <span>{t("Đang tìm kiếm...")}</span>
                    </div>
                  ) : paginatedAlbums.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                        {paginatedAlbums.map(album => (
                          <div 
                            key={album._id}
                            onClick={() => navigate(`/playlist-detail?id=${album._id}`)}
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

                      {/* Pagination Controls */}
                      {albumsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                          <button
                            disabled={albumsPage <= 1}
                            onClick={() => setAlbumsPage(prev => Math.max(prev - 1, 1))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              albumsPage <= 1 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_before</span>
                          </button>

                          {Array.from({ length: albumsTotalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setAlbumsPage(page)}
                              className={`w-10 h-10 rounded-full font-bold transition-all cursor-pointer ${
                                albumsPage === page
                                  ? 'bg-primary text-on-primary shadow-lg'
                                  : 'border border-white/10 hover:bg-white/5 text-white active:scale-95'
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            disabled={albumsPage >= albumsTotalPages}
                            onClick={() => setAlbumsPage(prev => Math.min(prev + 1, albumsTotalPages))}
                            className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 transition-all cursor-pointer ${
                              albumsPage >= albumsTotalPages 
                                ? 'opacity-40 cursor-not-allowed text-white/40' 
                                : 'hover:bg-primary/20 hover:border-primary text-white hover:text-primary active:scale-95'
                            }`}
                          >
                            <span className="material-symbols-outlined">navigate_next</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl mb-2">album</span>
                      <p className="font-body-md">{t("Chưa tìm thấy album nào phù hợp.")}</p>
                    </div>
                  )}
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
