import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { api } from '../utils/api.js';

export default function SearchResults() {
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [wasFuzzy, setWasFuzzy] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'songs', 'artists', 'albums'
  const [loading, setLoading] = useState(true);

  // Parse queries
  const searchParams = new URLSearchParams(location.search);
  const q = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';

  const executeSearch = async () => {
    setLoading(true);
    setResults([]);
    setRecommendations([]);
    setWasFuzzy(false);

    try {
      let endpoint = '/songs?isApproved=true';
      if (q) endpoint += `&q=${encodeURIComponent(q)}`;
      if (genre) endpoint += `&genre=${encodeURIComponent(genre)}`;

      const data = await api.get(endpoint);
      
      if (data && typeof data === 'object' && data.wasFuzzy) {
        setWasFuzzy(true);
        setRecommendations(data.recommendations || []);
        setResults([]);
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error('Search failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [q, genre]);

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Header query description */}
          <div>
            <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">search</span>
              {q ? `Kết quả tìm kiếm cho "${q}"` : genre ? `Thể loại: "${genre}"` : 'Tất cả bài hát'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              {!loading && (wasFuzzy ? 'Không tìm thấy kết quả phù hợp chính xác. Dưới đây là các gợi ý dành cho bạn:' : `Tìm thấy ${results.length} bài hát phù hợp.`)}
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[40vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">Đang tìm kiếm...</p>
            </div>
          ) : (
            <>
              {/* If fuzzy recommendations are served */}
              {wasFuzzy && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-tertiary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">recommend</span>
                    Ý bạn là / Đề xuất hàng đầu:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map(song => (
                      <div 
                        key={song._id}
                        onClick={() => playSong(song, recommendations, recommendations.indexOf(song))}
                        className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:scale-102 transition cursor-pointer group"
                      >
                        <img 
                          src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} 
                          alt={song.title} 
                          className="w-14 h-14 rounded-xl object-cover" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-secondary-container truncate">{song.title}</p>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition">play_circle</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Normal Results Grid */}
              {!wasFuzzy && results.length > 0 && (
                <div className="flex flex-col gap-4">
                  {/* Results list */}
                  <div className="glass-panel p-5 rounded-2xl flex flex-col divide-y divide-white/5">
                    {results.map((song, idx) => (
                      <div 
                        key={song._id}
                        onClick={() => playSong(song, results, idx)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-xs font-semibold text-on-surface-variant min-w-[20px] text-center">{idx + 1}</span>
                          <img 
                            src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} 
                            alt={song.title} 
                            className="w-12 h-12 rounded-lg object-cover" 
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-secondary-container transition truncate">{song.title}</p>
                            <p className="text-xs text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/5 border border-white/5 rounded text-on-surface-variant">
                            {song.genre}
                          </span>
                          <span className="material-symbols-outlined text-secondary-container opacity-0 group-hover:opacity-100 transition filled">
                            play_arrow
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No match and no fuzzy recommendations found */}
              {!wasFuzzy && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass-panel rounded-2xl min-h-[30vh]">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">search_off</span>
                  <p className="text-sm font-semibold text-white">Không tìm thấy bài hát nào</p>
                  <p className="text-xs text-on-surface-variant mt-1">Hãy thử tìm kiếm với các từ khóa hoặc thể loại khác.</p>
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
