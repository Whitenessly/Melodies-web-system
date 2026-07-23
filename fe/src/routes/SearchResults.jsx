import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function SearchResults() {
  const { playSong } = usePlayer();
  const { user, updateProfileState } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [wasFuzzy, setWasFuzzy] = useState(false);
  const [matchingArtists, setMatchingArtists] = useState([]);
  const [matchingPlaylists, setMatchingPlaylists] = useState([]);
  const [suggestedQuery, setSuggestedQuery] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'songs', 'artists', 'playlists'
  const [loading, setLoading] = useState(true);

  // Pagination states for Songs
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Pagination states for Artists
  const [artistPage, setArtistPage] = useState(1);
  const [totalArtistPages, setTotalArtistPages] = useState(1);
  const [totalArtistResults, setTotalArtistResults] = useState(0);

  // Pagination states for Playlists
  const [playlistPage, setPlaylistPage] = useState(1);
  const [totalPlaylistPages, setTotalPlaylistPages] = useState(1);
  const [totalPlaylistResults, setTotalPlaylistResults] = useState(0);

  // Responsive limits detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const artistLimit = isMobile ? 4 : 8;
  const playlistLimit = isMobile ? 4 : 5;

  // Parse queries
  const searchParams = new URLSearchParams(location.search);
  const q = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';

  const executeSearch = async () => {
    setLoading(true);
    setRecommendations([]);
    setWasFuzzy(false);
    setSuggestedQuery(null);

    try {
      let endpoint = `/songs?isApproved=true&limit=10&page=${currentPage}&artistPage=${artistPage}&artistLimit=${artistLimit}&playlistPage=${playlistPage}&playlistLimit=${playlistLimit}`;
      if (q) endpoint += `&q=${encodeURIComponent(q)}`;
      if (genre) endpoint += `&genre=${encodeURIComponent(genre)}`;

      const data = await api.get(endpoint);
      
      if (data && typeof data === 'object' && data.wasFuzzy) {
        setWasFuzzy(true);
        setRecommendations(data.recommendations || []);
        setResults([]);
        setMatchingArtists([]);
        setMatchingPlaylists([]);
        setSuggestedQuery(null);
        setTotalPages(1);
        setTotalResults(0);
        setTotalArtistPages(1);
        setTotalArtistResults(0);
        setTotalPlaylistPages(1);
        setTotalPlaylistResults(0);
      } else if (data && typeof data === 'object' && data.songs) {
        setResults(data.songs);
        setSuggestedQuery(data.suggestedQuery || null);
        setTotalPages(data.pagination?.pages || 1);
        setTotalResults(data.pagination?.total || 0);

        // Artists parsing (handles paginated object or array fallback)
        if (data.artists && typeof data.artists === 'object' && Array.isArray(data.artists.data)) {
          setMatchingArtists(data.artists.data);
          setTotalArtistPages(data.artists.pagination?.pages || 1);
          setTotalArtistResults(data.artists.pagination?.total || 0);
        } else if (Array.isArray(data.artists)) {
          setMatchingArtists(data.artists);
          setTotalArtistPages(1);
          setTotalArtistResults(data.artists.length);
        } else {
          setMatchingArtists([]);
          setTotalArtistPages(1);
          setTotalArtistResults(0);
        }

        // Playlists parsing (handles paginated object or array fallback)
        if (data.playlists && typeof data.playlists === 'object' && Array.isArray(data.playlists.data)) {
          setMatchingPlaylists(data.playlists.data);
          setTotalPlaylistPages(data.playlists.pagination?.pages || 1);
          setTotalPlaylistResults(data.playlists.pagination?.total || 0);
        } else if (Array.isArray(data.playlists)) {
          setMatchingPlaylists(data.playlists);
          setTotalPlaylistPages(1);
          setTotalPlaylistResults(data.playlists.length);
        } else {
          setMatchingPlaylists([]);
          setTotalPlaylistPages(1);
          setTotalPlaylistResults(0);
        }
      } else {
        setResults(data || []);
        setMatchingArtists([]);
        setMatchingPlaylists([]);
        setSuggestedQuery(data?.suggestedQuery || null);
        setTotalPages(1);
        setTotalResults(data ? data.length : 0);
        setTotalArtistPages(1);
        setTotalArtistResults(0);
        setTotalPlaylistPages(1);
        setTotalPlaylistResults(0);
      }
    } catch (err) {
      console.error('Search failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (e, song) => {
    e.stopPropagation(); // Prevent playing the song
    if (!user) return;
    
    const isLiked = user.likedSongs?.includes(song._id);
    try {
      if (isLiked) {
        await api.post(`/songs/${song._id}/unlike`);
        const updatedLiked = user.likedSongs.filter(id => id !== song._id);
        updateProfileState({ likedSongs: updatedLiked });
      } else {
        await api.post(`/songs/${song._id}/like`);
        const updatedLiked = [...(user.likedSongs || []), song._id];
        updateProfileState({ likedSongs: updatedLiked });
      }
    } catch (err) {
      console.error('Failed to toggle like:', err.message);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setArtistPage(1);
    setPlaylistPage(1);
  }, [q, genre]);

  useEffect(() => {
    executeSearch();
  }, [q, genre, currentPage, artistPage, playlistPage, isMobile]);

  const renderPaginationControls = (curPage, totPages, onPageChange) => {
    if (totPages <= 1) return null;

    const uniquePages = new Set();
    uniquePages.add(1);
    if (totPages > 0) uniquePages.add(totPages);
    if (curPage > 1) uniquePages.add(curPage - 1);
    uniquePages.add(curPage);
    if (curPage < totPages) uniquePages.add(curPage + 1);

    const sortedPages = Array.from(uniquePages).sort((a, b) => a - b);
    const pages = [];
    let prev = null;

    for (const p of sortedPages) {
      if (prev !== null && p - prev > 1) {
        pages.push('...');
      }
      pages.push(p);
      prev = p;
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          type="button"
          disabled={curPage === 1}
          onClick={() => onPageChange(Math.max(1, curPage - 1))}
          className="w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-xs text-white"
        >
          <span className="material-symbols-outlined text-sm">navigate_before</span>
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ell-${idx}`} className="text-on-surface-variant px-1.5 select-none text-xs font-bold font-mono">
                ...
              </span>
            );
          }
          return (
            <button
              type="button"
              key={`pg-${p}`}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-full border text-xs font-bold transition cursor-pointer ${
                curPage === p 
                  ? 'bg-primary border-primary text-black' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={curPage === totPages}
          onClick={() => onPageChange(Math.min(totPages, curPage + 1))}
          className="w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-xs text-white"
        >
          <span className="material-symbols-outlined text-sm">navigate_next</span>
        </button>
      </div>
    );
  };

  const grandTotal = totalResults + totalArtistResults + totalPlaylistResults;

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Header query description */}
          <div>
            <h1 className="font-display-lg text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">search</span>
              {q ? `${t('showing_results_for')} "${q}"` : genre ? `${t('search')}: "${genre}"` : t('all_songs')}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
              {!loading && (wasFuzzy ? t('no_exact_results_fuzzy') : suggestedQuery ? `${t('showing_results_for')} "${suggestedQuery}".` : `${t('found')} ${grandTotal} ${t('matching_songs_count')}`)}
            </p>
          </div>

          {/* Suggested Query Banner */}
          {!loading && suggestedQuery && (
            <div className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl border-l-4 border-primary flex items-center gap-3 mb-2 shadow-lg">
              <span className="material-symbols-outlined text-primary text-xl animate-pulse">info</span>
              <p className="text-sm font-semibold text-white">
                {t('suggested_query_prefix')} "{q}". {t('suggested_query_prompt')} 
                <button 
                  type="button"
                  onClick={() => navigate(`/search-results?q=${encodeURIComponent(suggestedQuery)}`)}
                  className="text-primary hover:underline ml-1 font-bold cursor-pointer"
                >
                  "{suggestedQuery}"
                </button> ?
              </p>
            </div>
          )}

          {/* Category Tabs */}
          {!loading && !wasFuzzy && grandTotal > 0 && (
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'all' 
                    ? 'bg-primary text-black' 
                    : 'bg-[#121212]/60 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t('all_tab')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('songs')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'songs' 
                    ? 'bg-primary text-black' 
                    : 'bg-[#121212]/60 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t('songs_tab')}</span>
                {totalResults > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">{totalResults}</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('artists')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'artists' 
                    ? 'bg-primary text-black' 
                    : 'bg-[#121212]/60 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t('artists_tab')}</span>
                {totalArtistResults > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">{totalArtistResults}</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('playlists')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'playlists' 
                    ? 'bg-primary text-black' 
                    : 'bg-[#121212]/60 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t('playlists_tab')}</span>
                {totalPlaylistResults > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">{totalPlaylistResults}</span>}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[40vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('searching')}</p>
            </div>
          ) : (
            <>
              {/* Fuzzy recommendations */}
              {wasFuzzy && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">recommend</span>
                    {t('did_you_mean')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map(song => (
                      <div 
                        key={song._id}
                        onClick={() => playSong(song, recommendations, recommendations.indexOf(song))}
                        className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:scale-102 transition cursor-pointer group shadow-md"
                      >
                        <img 
                          src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} 
                          alt={song.title} 
                          className="w-14 h-14 rounded-xl object-cover border border-white/5 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-primary truncate">{song.title}</p>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                        </div>
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition">play_circle</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Artists Section */}
              {!wasFuzzy && (activeTab === 'all' || activeTab === 'artists') && matchingArtists.length > 0 && (
                <div className="flex flex-col gap-4 mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">person</span>
                      {t('related_artists')}:
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {totalArtistResults} {t('artists_tab').toLowerCase()} ({artistPage}/{totalArtistPages})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matchingArtists.map(artist => (
                      <div 
                        key={artist._id}
                        onClick={() => navigate(`/artist-detail?id=${artist._id}`)}
                        className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:scale-102 hover:border-white/10 transition cursor-pointer group shadow-md"
                      >
                        <img 
                          src={artist.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                          alt={artist.name} 
                          className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-primary transition duration-300 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-primary truncate transition">{artist.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{artist.followersCount || 0} {t('followers')}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition text-lg">arrow_forward</span>
                      </div>
                    ))}
                  </div>

                  {renderPaginationControls(artistPage, totalArtistPages, setArtistPage)}
                </div>
              )}

              {/* Related Playlists Section */}
              {!wasFuzzy && (activeTab === 'all' || activeTab === 'playlists') && matchingPlaylists.length > 0 && (
                <div className="flex flex-col gap-4 mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">queue_music</span>
                      {t('related_playlists')}:
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {totalPlaylistResults} {t('playlists_tab').toLowerCase()} ({playlistPage}/{totalPlaylistPages})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {matchingPlaylists.map(playlist => (
                      <div 
                        key={playlist._id}
                        onClick={() => navigate(`/playlist-detail?id=${playlist._id}`)}
                        className="bg-[#121212]/40 border border-white/5 p-3.5 rounded-2xl flex flex-col gap-3 hover:scale-102 hover:border-white/10 transition cursor-pointer group shadow-md"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5">
                          <img 
                            src={playlist.thumbnailUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300'} 
                            alt={playlist.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-4xl filled">play_circle</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-primary truncate transition">{playlist.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span>
                            {playlist.userId?.name || 'User'}
                          </p>
                          <p className="text-[11px] text-on-surface-variant/80 mt-1 font-mono">
                            {playlist.songs?.length || 0} {t('songs')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {renderPaginationControls(playlistPage, totalPlaylistPages, setPlaylistPage)}
                </div>
              )}

              {/* Normal Results Grid for Songs */}
              {!wasFuzzy && (activeTab === 'all' || activeTab === 'songs') && results.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">music_note</span>
                      {t('songs_tab')}:
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {totalResults} {t('songs')} ({currentPage}/{totalPages})
                    </span>
                  </div>

                  {/* Results list */}
                  <div className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-0.5">
                    {results.map((song, idx) => {
                      const globalIdx = (currentPage - 1) * 10 + idx + 1;
                      return (
                        <div 
                          key={song._id}
                          onClick={() => playSong(song, results, idx)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="text-xs font-semibold text-on-surface-variant min-w-[20px] text-center">{globalIdx}</span>
                            <img 
                              src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} 
                              alt={song.title} 
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/5" 
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-primary transition truncate">{song.title}</p>
                              <p className="text-xs text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:gap-6 shrink-0">
                            {user && (
                              <button
                                type="button"
                                onClick={(e) => handleLikeToggle(e, song)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition cursor-pointer text-on-surface-variant hover:text-white"
                              >
                                {user.likedSongs?.includes(song._id) ? (
                                  <span className="material-symbols-outlined text-heart-active filled text-base md:text-lg">favorite</span>
                                ) : (
                                  <span className="material-symbols-outlined text-base md:text-lg opacity-70 md:opacity-0 group-hover:opacity-100 hover:scale-110 transition">favorite</span>
                                )}
                              </button>
                            )}

                            <span className="text-xs text-on-surface-variant font-mono hidden xs:inline">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider px-1.5 md:px-2 py-0.5 bg-white/5 border border-white/10 rounded text-on-surface-variant hidden sm:inline">
                              {song.genre}
                            </span>
                            <span className="material-symbols-outlined text-primary text-xl md:text-2xl transition filled">
                              play_arrow
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {renderPaginationControls(currentPage, totalPages, setCurrentPage)}
                </div>
              )}

              {/* Specific empty state for tab filtering */}
              {!wasFuzzy && activeTab === 'songs' && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#121212]/40 border border-white/5 rounded-2xl min-h-[25vh]">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">music_off</span>
                  <p className="text-sm font-semibold text-white">Không tìm thấy bài hát nào phù hợp</p>
                </div>
              )}

              {!wasFuzzy && activeTab === 'artists' && matchingArtists.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#121212]/40 border border-white/5 rounded-2xl min-h-[25vh]">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">person_off</span>
                  <p className="text-sm font-semibold text-white">Không tìm thấy nghệ sĩ nào phù hợp</p>
                </div>
              )}

              {!wasFuzzy && activeTab === 'playlists' && matchingPlaylists.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#121212]/40 border border-white/5 rounded-2xl min-h-[25vh]">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">queue_music</span>
                  <p className="text-sm font-semibold text-white">Không tìm thấy danh sách phát nào phù hợp</p>
                </div>
              )}

              {/* No match across all tabs */}
              {!wasFuzzy && grandTotal === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#121212]/40 border border-white/5 rounded-2xl min-h-[30vh]">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">search_off</span>
                  <p className="text-sm font-semibold text-white">{t('no_matching_results')}</p>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">{t('try_other_keywords')}</p>
                </div>
              )}
            </>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
