import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function Home() {
  const { user, updateProfileState } = useAuth();
  const { playSong } = usePlayer();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHomeData = async () => {
    try {
      const [catsData, songsData, artistsData] = await Promise.all([
        api.get('/categories'),
        api.get('/songs?isApproved=true'),
        api.get('/users/artists')
      ]);
      setCategories(catsData);
      setSongs(songsData);
      setArtists(artistsData.slice(0, 5)); // show top 5 suggestions
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleFollowToggle = async (artist) => {
    const isFollowing = user.following?.includes(artist._id);
    try {
      if (isFollowing) {
        await api.post(`/users/${artist._id}/unfollow`);
        const updatedFollowing = user.following.filter(id => id !== artist._id);
        updateProfileState({ following: updatedFollowing });
        setArtists(prev => prev.map(a => a._id === artist._id ? { ...a, followersCount: a.followersCount - 1 } : a));
      } else {
        await api.post(`/users/${artist._id}/follow`);
        const updatedFollowing = [...(user.following || []), artist._id];
        updateProfileState({ following: updatedFollowing });
        setArtists(prev => prev.map(a => a._id === artist._id ? { ...a, followersCount: a.followersCount + 1 } : a));
      }
    } catch (err) {
      console.log('Follow action failed:', err.message);
    }
  };

  // Pre-defined colorful gradients for bento categories
  const bentoGradients = [
    'from-[#FF2D55] to-[#FF9500]',
    'from-primary to-tertiary',
    'from-[#53e076] to-[#00913d]',
    'from-[#FFB800] to-[#FF4444]',
    'from-[#00C6FF] to-[#0072FF]',
    'from-[#f857a6] to-[#ff5858]'
  ];

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Sidebar Nav */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="md:ml-sidebar-width flex-1 p-8 flex flex-col gap-10 overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[50vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('loading_homepage')}</p>
            </div>
          ) : (
            <>
              {/* Category Bento Grid */}
              {/* Category Bento Grid */}
              <section className="flex flex-col gap-5">
                <h2 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">grid_view</span>
                  {t('explore_categories')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat._id}
                      onClick={() => navigate(`/search-results?genre=${encodeURIComponent(cat.name)}`)}
                      className={`h-28 rounded-2xl bg-gradient-to-br ${bentoGradients[idx % bentoGradients.length]} p-5 flex flex-col justify-between cursor-pointer hover:scale-105 transition-all duration-300 relative overflow-hidden group shadow-lg`}
                    >
                      {/* Ambient background symbol */}
                      <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl opacity-15 rotate-12 group-hover:scale-110 transition duration-300">
                        music_note
                      </span>
                      <span className="font-display-lg font-bold text-sm text-white uppercase tracking-wider">{cat.name}</span>
                      <span className="text-[10px] text-white/80 line-clamp-1 font-medium">{cat.description}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Grid split for Recommended Songs & Featured Artists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recommended Songs (Left 2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <h2 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">music_note</span>
                    {t('recommended_songs')}
                  </h2>
                  <div className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-0.5">
                    {songs.slice(0, 6).map((song, idx) => (
                      <div
                        key={song._id}
                        onClick={() => playSong(song, songs, idx)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-sm font-semibold text-on-surface-variant min-w-[20px]">{idx + 1}</span>
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

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                          <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition text-primary">
                            <span className="material-symbols-outlined filled text-xl flex items-center justify-center">play_arrow</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Artists suggestions (Right 1 col) */}
                <div className="flex flex-col gap-5">
                  <h2 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">stars</span>
                    {t('artists_recommendation')}
                  </h2>
                  <div className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                    {artists.map(art => {
                      const isFollowing = user.following?.includes(art._id);
                      return (
                        <div key={art._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.01] transition">
                          <div
                            onClick={() => navigate(`/artist-detail?id=${art._id}`)}
                            className="flex items-center gap-3 cursor-pointer group min-w-0"
                          >
                            <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0 border border-white/5">
                              {art.avatarUrl ? (
                                <img src={art.avatarUrl} alt={art.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                              ) : (
                                art.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-primary transition truncate">{art.name}</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">{art.followersCount || 0} {t('followers')}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleFollowToggle(art)}
                            className={`text-[10px] font-bold px-4 py-1.5 rounded-full transition cursor-pointer flex-shrink-0 ${isFollowing
                                ? 'border border-white/20 text-white hover:bg-white/10'
                                : 'bg-primary text-black hover:scale-105'
                              }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* Persistent Audio Bottom Player */}
      <MusicPlayer />
    </div>
  );
}
