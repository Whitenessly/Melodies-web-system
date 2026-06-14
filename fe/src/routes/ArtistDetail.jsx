import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const ArtistDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { play, currentSong, isPlaying, togglePlay } = usePlayer();
  const { user, toggleLikeSong, toggleFollowArtist } = useAuth();
  const { t } = useLanguage();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [fansAlsoLike, setFansAlsoLike] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract ID from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const artistId = queryParams.get('id');

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      let activeId = artistId;

      // If no ID is passed, fetch all artists and use the first one
      if (!activeId) {
        const allArtistsData = await api.get('/users/artists');
        const artists = allArtistsData.artists || [];
        if (artists.length > 0) {
          activeId = artists[0]._id;
          navigate(`/artist-detail?id=${activeId}`, { replace: true });
          return;
        } else {
          setLoading(false);
          return;
        }
      }

      // Fetch artist public profile and songs
      const data = await api.get(`/users/artists/${activeId}`);
      setArtist(data.artist);
      setSongs(data.songs || []);

      // Fetch other artists for "Fans Also Like"
      const allArtists = await api.get('/users/artists');
      const otherArtists = (allArtists.artists || []).filter(a => a._id !== activeId);
      setFansAlsoLike(otherArtists.slice(0, 4));
    } catch (err) {
      console.error('Failed to load artist details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtistData();
  }, [artistId]);

  const handlePlayNow = () => {
    if (songs.length > 0) {
      play(songs[0], songs);
    }
  };

  const handlePlaySong = (song) => {
    play(song, songs);
  };

  const handleFollowClick = async () => {
    if (!artist) return;
    try {
      const isNowFollowing = await toggleFollowArtist(artist._id);
      setArtist(prev => ({
        ...prev,
        isFollowing: isNowFollowing,
        followersCount: isNowFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1)
      }));
    } catch (err) {
      console.error('Failed to follow/unfollow artist:', err);
    }
  };

  const handleLikeClick = async (e, songId) => {
    e.stopPropagation();
    try {
      await toggleLikeSong(songId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const isLiked = (songId) => user?.likedSongs?.includes(songId) || false;

  const totalViews = songs.reduce((sum, s) => sum + s.views, 0);

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="md:ml-sidebar-width min-h-screen bg-background">
          <Header />
          <div className="flex items-center justify-center h-[calc(100vh-64px)] text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>{t("Đang tải thông tin nghệ sĩ...")}</span>
          </div>
        </main>
        <MusicPlayer />
      </>
    );
  }

  if (!artist) {
    return (
      <>
        <Sidebar />
        <main className="md:ml-sidebar-width min-h-screen bg-background p-8">
          <Header />
          <div className="glass-panel p-12 rounded-3xl text-center text-on-surface-variant max-w-lg mx-auto mt-20">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">person_off</span>
            <p className="font-body-lg text-body-lg">{t("Không tìm thấy thông tin nghệ sĩ này.")}</p>
            <button 
              onClick={() => navigate('/home')}
              className="mt-6 px-6 py-2 rounded-full bg-primary text-on-primary font-bold hover:brightness-110 active:scale-95 transition-all"
            >
              {t("Quay lại trang chủ")}
            </button>
          </div>
        </main>
        <MusicPlayer />
      </>
    );
  }

  // Cover image based on artist name or fallback
  const artistBannerImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCGGVOrVCJVyMIf41e6-hbfr_BMtC5t7rqp5ns9EX7i7DogTlVDWukAErtDRtblo0BgbYJghWRW5_rityqe2Dz9joyc4LYH6RxaG0vkZTPHSlmVxYVE3HOjjbWqtX5qjcB6h8FFo2mwcGiLDW95HLbUg2dCw96gBGQqK27vnbzHm9AGHGqAcbY3V75SJj7xJLXDd3UofWFpzlTRJGEpdcu81zJkK3BNzPXLVhFukMOf6OU2EU8wMbCEogViDeBhPFz91TBp9JuwokI";
  const bannerSrc = artist.avatarUrl ? getFullUrl(artist.avatarUrl) : artistBannerImg;

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width overflow-y-auto pb-[120px] relative bg-background min-h-screen">
        
        {/* Banner header */}
        <header className="relative h-[480px] w-full flex items-end">
          <img 
            alt="Artist Banner" 
            className="absolute inset-0 w-full h-full object-cover brightness-60" 
            src={bannerSrc} 
          />
          {/* Dark gradient overlap */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30"></div>

          <div className="relative w-full px-margin-page pb-12 z-10">
            <div className="flex items-center gap-2 text-secondary mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-label-md text-label-md uppercase tracking-wider font-bold">{t("Nghệ sĩ xác minh")}</span>
            </div>
            
            <h2 className="font-headline-xl text-headline-xl text-white mb-6 font-bold tracking-tight">
              {artist.name}
            </h2>
 
            <div className="flex items-center gap-6">
              {songs.length > 0 ? (
                <button 
                  onClick={handlePlayNow}
                  className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  {t("PHÁT NGHE")}
                </button>
              ) : (
                <button 
                  disabled
                  className="bg-white/10 text-white/50 px-8 py-3.5 rounded-full font-label-md text-label-md font-bold cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">music_off</span>
                  {t("Không có nhạc")}
                </button>
              )}
 
              <button 
                onClick={handleFollowClick}
                className={`px-8 py-3.5 rounded-full font-label-md text-label-md font-bold border-2 transition-all active:scale-95 cursor-pointer ${
                  artist.isFollowing 
                    ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                    : 'border-white/20 hover:border-white/50 text-white'
                }`}
              >
                {artist.isFollowing ? t('ĐANG THEO DÕI') : t('THEO DÕI')}
              </button>
 
              <div className="ml-auto text-on-surface-variant font-label-md text-label-md">
                <span className="text-white font-bold text-lg">{artist.followersCount.toLocaleString()}</span> {t("Người theo dõi")}
              </div>
            </div>
          </div>
        </header>
 
        {/* Content columns */}
        <div className="px-margin-page mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 text-on-background">
          
          {/* Left Side: Song list */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <section>
              <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Danh sách bài hát")}</h3>
              
              {songs.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2">library_music</span>
                  <p>{t("Nghệ sĩ chưa có bài hát nào được duyệt.")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {songs.map((song, idx) => {
                    const activePlay = currentSong && currentSong._id === song._id;
                    return (
                      <div 
                        key={song._id}
                        onClick={() => handlePlaySong(song)}
                        className={`group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                          activePlay ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className="w-6 text-on-surface-variant font-label-md text-label-md text-center font-bold group-hover:hidden">
                          {idx + 1}
                        </span>
                        
                        <span className="w-6 material-symbols-outlined text-primary hidden group-hover:block text-center">
                          {activePlay && isPlaying ? 'pause' : 'play_arrow'}
                        </span>

                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
                          <img 
                            className="w-full h-full object-cover" 
                            src={getFullUrl(song.thumbnailUrl)} 
                            alt={song.title} 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`font-body-md text-body-md font-semibold truncate ${
                            activePlay ? 'text-primary' : 'text-white'
                          }`}>
                            {song.title}
                          </h4>
                          <p className="text-on-surface-variant text-label-sm">{song.genre}</p>
                        </div>

                        <div className="text-on-surface-variant text-label-md font-mono hidden sm:block">
                          {song.views.toLocaleString()} {t("lượt nghe")}
                        </div>

                        <button 
                          onClick={(e) => handleLikeClick(e, song._id)}
                          className={`material-symbols-outlined transition-colors cursor-pointer ${
                            isLiked(song._id) ? 'filled text-primary' : 'text-on-surface-variant hover:text-white'
                          }`}
                        >
                          favorite
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Side: Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            
            {/* Biography */}
            <section className="glass-panel rounded-3xl p-8 relative overflow-hidden group border border-white/5">
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-4 font-bold">{t("Giới thiệu")}</h3>
                <p className="text-on-surface-variant font-body-md leading-relaxed mb-6">
                  {artist.name}{t(" là một nghệ sĩ sáng tạo, đam mê tạo ra các cung bậc cảm xúc âm nhạc đỉnh cao. Sự kết hợp khéo léo giữa ca từ sâu lắng và các giai điệu tinh tế đem lại một làn sóng mới cho người hâm mộ.")}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-surface-container/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">{t("Tổng lượt nghe")}</p>
                    <h4 className="font-headline-md text-headline-md text-secondary font-bold font-mono">
                      {totalViews.toLocaleString()}
                    </h4>
                  </div>
                  <div className="bg-surface-container/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">{t("Bài hát")}</p>
                    <h4 className="font-headline-md text-headline-md text-primary font-bold font-mono">
                      {songs.length}
                    </h4>
                  </div>
                </div>
              </div>
            </section>

            {/* Fans Also Like */}
            {fansAlsoLike.length > 0 && (
              <section>
                <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">{t("Người hâm mộ cũng thích")}</h3>
                <div className="space-y-4">
                  {fansAlsoLike.map(other => (
                    <div 
                      key={other._id}
                      onClick={() => navigate(`/artist-detail?id=${other._id}`)}
                      className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-all"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container flex items-center justify-center font-bold text-sm text-primary shrink-0 shadow-md">
                        {other.avatarUrl ? (
                          <img className="w-full h-full object-cover" src={getFullUrl(other.avatarUrl)} alt={other.name} />
                        ) : (
                          other.name[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-body-md text-body-md font-bold text-white group-hover:text-primary transition-colors truncate">
                          {other.name}
                        </h5>
                        <p className="text-on-surface-variant text-label-sm uppercase tracking-wider">{t("Nghệ sĩ")}</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant hover:text-white">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>
      </main>

      <MusicPlayer />
    </>
  );
};

export default ArtistDetail;
