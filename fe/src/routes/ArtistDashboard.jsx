import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function ArtistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [artistSongs, setArtistSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard stats
  const [totalStreams, setTotalStreams] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [followers, setFollowers] = useState(0);

  const loadArtistData = async () => {
    try {
      const songs = await api.get(`/songs?artistId=${user.id || user._id}`);
      setArtistSongs(songs);
      
      // Accumulate metrics
      const streams = songs.reduce((sum, song) => sum + (song.stream_count || song.views || 0), 0);
      const likes = songs.reduce((sum, song) => sum + (song.likes || 0), 0);
      
      setTotalStreams(streams);
      setTotalLikes(likes);
      
      // Get fresh profile details to check follower counts
      const profile = await api.get(`/users/${user.id || user._id}`);
      setFollowers(profile.followersCount || 0);
    } catch (err) {
      console.error('Failed to load artist metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtistData();
  }, [user]);

  const daysKeys = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mic</span>
                {t('artist_dashboard_title')}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                {t('artist_dashboard_subtitle')}
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/upload-manage')}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-5 py-2.5 rounded-full hover:scale-105 transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-base font-bold">publish</span>
              {t('upload_new_song_btn')}
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[40vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('loading_analytics')}</p>
            </div>
          ) : (
            <>
              {/* Analytics Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">play_circle</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t('total_streams')}</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{totalStreams.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">favorite</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t('total_likes')}</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{totalLikes.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">group</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{t('artist_followers')}</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{followers.toLocaleString()}</p>
                  </div>
                </div>

              </div>

              {/* simulated analytics chart layout */}
              <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-6 shadow-md">
                <div>
                  <h3 className="text-sm font-bold text-white">{t('weekly_trends')}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">{t('weekly_trends_desc')}</p>
                </div>
                
                {/* Visual Chart Bars */}
                <div className="h-48 flex items-end justify-between px-4 pb-2 border-b border-white/5 gap-4">
                  {[45, 60, 55, 80, 110, 95, 140].map((val, idx) => {
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div 
                          className="w-full rounded-t bg-gradient-to-t from-primary/20 to-primary group-hover:brightness-110 transition-all duration-500"
                          style={{ height: `${val}px` }}
                        />
                        <span className="text-[9px] font-semibold text-on-surface-variant group-hover:text-white transition">{t(daysKeys[idx])}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uploaded Track Catalog List */}
              <div className="flex flex-col gap-4">
                <h3 className="font-display-lg text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">list</span>
                  {t('your_releases')} ({artistSongs.length})
                </h3>

                {artistSongs.length > 0 ? (
                  <div className="bg-[#121212]/40 border border-white/5 rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                          <th className="p-4">{t('table_song')}</th>
                          <th className="p-4">{t('table_genre')}</th>
                          <th className="p-4 text-center">{t('table_streams')}</th>
                          <th className="p-4 text-center">{t('table_likes')}</th>
                          <th className="p-4 text-center">{t('table_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {artistSongs.map(song => (
                          <tr key={song._id} className="hover:bg-white/[0.04] transition duration-150">
                            <td className="p-4 flex items-center gap-3">
                              <img 
                                src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border border-white/5" 
                              />
                              <div>
                                <p className="font-bold text-white">{song.title}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">{Math.floor(song.duration / 60)}m {song.duration % 60}s</p>
                              </div>
                            </td>
                            <td className="p-4 text-on-surface-variant font-semibold">{song.genre}</td>
                            <td className="p-4 text-center font-mono text-white">{(song.stream_count || song.views || 0).toLocaleString()}</td>
                            <td className="p-4 text-center font-mono text-white">{(song.likes || 0).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                                song.status === 'approved' 
                                  ? 'bg-primary/10 text-primary' 
                                  : song.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-red-500/10 text-red-500'
                              }`}>
                                {song.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#121212]/40 p-8 text-center rounded-2xl border border-white/5">
                    <p className="text-xs text-on-surface-variant font-medium">{t('no_songs_uploaded')}</p>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
