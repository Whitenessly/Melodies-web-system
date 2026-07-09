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
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-900 to-[#121212] p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-6 min-h-[250px] shadow-xl">
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-10 scale-105 pointer-events-none"
              style={{ backgroundImage: `url(${artist.avatarUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'})` }}
            />
            
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/5 bg-zinc-800 flex items-center justify-center font-bold text-3xl shadow-2xl relative z-10 shrink-0">
              {artist.avatarUrl ? (
                <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                artist.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="relative z-10 flex-1 text-center md:text-left flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary w-max mx-auto md:mx-0 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[12px] filled">verified</span>
                {t('verified_artist')}
              </span>
              <h1 className="font-display-lg text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white leading-none mt-1">{artist.name}</h1>
              <p className="text-xs text-on-surface-variant font-semibold mt-1">{artist.followersCount || 0} {t('followers')}</p>
            </div>

            <button 
              onClick={handleFollowToggle}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 z-10 hover:scale-105 active:scale-95 ${
                isFollowing 
                  ? 'border border-white/20 text-white hover:bg-white/10' 
                  : 'bg-primary text-black'
              }`}
            >
              {isFollowing ? t('following_btn') : t('follow_artist')}
            </button>
          </div>

          {/* Songs catalog */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display-lg text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">album</span>
              {t('all_songs')}
            </h2>

            {songs.length > 0 ? (
              <div className="bg-[#121212]/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-0.5 shadow-md">
                {songs.map((song, idx) => (
                  <div 
                    key={song._id}
                    onClick={() => playSong(song, songs, idx)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-xs font-semibold text-on-surface-variant min-w-[20px]">{idx + 1}</span>
                      <img 
                        src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} 
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/5" 
                        alt="" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-primary transition truncate">{song.title}</p>
                        <p className="text-[10px] text-on-surface-variant truncate mt-0.5 font-medium">{song.genre}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-on-surface-variant font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60) < 10 ? '0' : ''}{song.duration % 60}</span>
                      <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition filled text-xl">play_arrow</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#121212]/40 p-8 text-center rounded-2xl border border-white/5">
                <p className="text-xs text-on-surface-variant font-medium">{t('no_songs_by_artist')}</p>
              </div>
            )}
          </div>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
