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
  const [suggestedQuery, setSuggestedQuery] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'songs', 'artists', 'albums'
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

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
      let endpoint = `/songs?isApproved=true&limit=10&page=${currentPage}`;
      if (q) endpoint += `&q=${encodeURIComponent(q)}`;
      if (genre) endpoint += `&genre=${encodeURIComponent(genre)}`;

      const data = await api.get(endpoint);
      
      if (data && typeof data === 'object' && data.wasFuzzy) {
        setWasFuzzy(true);
        setRecommendations(data.recommendations || []);
        setResults([]);
        setMatchingArtists([]);
        setSuggestedQuery(null);
        setTotalPages(1);
        setTotalResults(0);
      } else if (data && typeof data === 'object' && data.songs) {
        setResults(data.songs);
        setMatchingArtists(data.artists || []);
        setSuggestedQuery(data.suggestedQuery || null);
        setTotalPages(data.pagination?.pages || 1);
        setTotalResults(data.pagination?.total || 0);
      } else {
        setResults(data || []);
        setMatchingArtists([]);
        setSuggestedQuery(data.suggestedQuery || null);
        setTotalPages(1);
        setTotalResults(data ? data.length : 0);
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
  }, [q, genre]);

  useEffect(() => {
    executeSearch();
  }, [q, genre, currentPage]);

  const getPaginationPages = () => {
    const pages = [];
    const uniquePages = new Set();
    
    uniquePages.add(1);
    if (totalPages > 0) uniquePages.add(totalPages);
    
    if (currentPage > 1) uniquePages.add(currentPage - 1);
    uniquePages.add(currentPage);
    if (currentPage < totalPages) uniquePages.add(currentPage + 1);
    
    const sortedPages = Array.from(uniquePages).sort((a, b) => a - b);
    
    let prev = null;
    for (const p of sortedPages) {
      if (prev !== null) {
        if (p - prev > 1) {
          pages.push('...');
        }
      }
      pages.push(p);
      prev = p;
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Header query description */}
          <div>
            <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">search</span>
              {q ? `${t('showing_results_for')} "${q}"` : genre ? `${t('search')}: "${genre}"` : t('all_songs')}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
              {!loading && (wasFuzzy ? t('no_exact_results_fuzzy') : suggestedQuery ? `${t('showing_results_for')} "${suggestedQuery}".` : `${t('found')} ${totalResults} ${t('matching_songs_count')}`)}
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

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[40vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('searching')}</p>
            </div>
          ) : (
            <>
              {/* If fuzzy recommendations are served */}
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
              {!wasFuzzy && matchingArtists.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">person</span>
                    {t('related_artists')}:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                </div>
              )}

              {/* Normal Results Grid */}
              {!wasFuzzy && results.length > 0 && (
                <div className="flex flex-col gap-4">
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

                          <div className="flex items-center gap-6">
                            {user && (
                              <button
                                type="button"
                                onClick={(e) => handleLikeToggle(e, song)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition cursor-pointer text-on-surface-variant hover:text-white"
                              >
                                {user.likedSongs?.includes(song._id) ? (
                                  <span className="material-symbols-outlined text-heart-active filled text-lg">favorite</span>
                                ) : (
                                  <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition">favorite</span>
                                )}
                              </button>
                            )}

                            <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/5 border border-white/10 rounded text-on-surface-variant">
                              {song.genre}
                            </span>
                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition filled">
                              play_arrow
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="w-9 h-9 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">navigate_before</span>
                      </button>
                      
                      {getPaginationPages().map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="text-on-surface-variant px-2 select-none text-sm font-bold font-mono">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            key={`page-${p}`}
                            onClick={() => setCurrentPage(p)}
                            className={`w-9 h-9 rounded-full border text-sm font-bold transition cursor-pointer ${
                              currentPage === p 
                                ? 'bg-primary border-primary text-black' 
                                : 'border-white/5 bg-white/5 hover:bg-white/10 text-on-surface-variant'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="w-9 h-9 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">navigate_next</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No match and no fuzzy recommendations found */}
              {!wasFuzzy && results.length === 0 && matchingArtists.length === 0 && (
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
