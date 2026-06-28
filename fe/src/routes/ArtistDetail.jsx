import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function ArtistDetail() {
  const { user, updateProfileState } = useAuth();
  const { playSong } = usePlayer();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const artistId = searchParams.get('id');

  const loadArtistData = async () => {
    if (!artistId) return;
    try {
      const artData = await api.get(`/users/${artistId}`);
      setArtist(artData);

      const songsData = await api.get(`/songs?artistId=${artistId}&isApproved=true`);
      setSongs(songsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtistData();
  }, [artistId]);

  const handleFollowToggle = async () => {
    if (!artist) return;
    const isFollowing = user.following?.includes(artist._id);
    try {
      if (isFollowing) {
        await api.post(`/users/${artist._id}/unfollow`);
        const updatedFollowing = user.following.filter(id => id !== artist._id);
        updateProfileState({ following: updatedFollowing });
        setArtist(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else {
        await api.post(`/users/${artist._id}/follow`);
        const updatedFollowing = [...(user.following || []), artist._id];
        updateProfileState({ following: updatedFollowing });
        setArtist(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center text-secondary-container">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <p>{t('artist_not_found')}</p>
          </div>
        </div>
      </div>
    );
  }

  const isFollowing = user.following?.includes(artist._id);

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-8">
          {/* Cover Header */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-10 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${artist.avatarUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'})` }}
            />
            
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/10 bg-secondary-container flex items-center justify-center font-bold text-3xl">
              {artist.avatarUrl ? (
                <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                artist.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="relative z-10 flex-1 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-secondary-container/10 border border-secondary-container/20 rounded text-secondary-container w-max mx-auto md:mx-0">
                Verified Artist
              </span>
              <h1 className="font-display-lg text-3xl font-extrabold tracking-tight text-white mt-2">{artist.name}</h1>
              <p className="text-xs text-on-surface-variant mt-1.5">{artist.followersCount || 0} {t('followers')}</p>
            </div>

            <button 
              onClick={handleFollowToggle}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isFollowing ? 'bg-white/10 text-white hover:bg-white/15' : 'electric-btn text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow Artist'}
            </button>
          </div>

          {/* Songs catalog */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">album</span>
              {t('all_songs')}
            </h2>

            {songs.length > 0 ? (
              <div className="glass-panel p-4 rounded-2xl flex flex-col divide-y divide-white/5">
                {songs.map((song, idx) => (
                  <div 
                    key={song._id}
                    onClick={() => playSong(song, songs, idx)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-xs font-semibold text-on-surface-variant min-w-[20px]">{idx + 1}</span>
                      <img src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-secondary-container transition truncate">{song.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{song.genre}</p>
                      </div>
                    </div>
                    
                    <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center rounded-2xl">
                <p className="text-xs text-on-surface-variant">{t('no_songs_by_artist')}</p>
              </div>
            )}
          </div>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
