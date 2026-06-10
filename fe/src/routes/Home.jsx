import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [songs, setSongs] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const songsData = await api.get('/songs');
        const chartsData = await api.get('/songs/charts');
        setSongs(songsData.songs || []);
        setCharts(chartsData.songs || []);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handlePlaySong = (song, list) => {
    play(song, list);
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />
      
      <main className="md:ml-sidebar-width pb-[120px] min-h-screen bg-background">
        <Header placeholder={t("Tìm kiếm bài hát, nghệ sĩ...")} />

        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-64px)] text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>{t("Đang tải giai điệu...")}</span>
          </div>
        ) : (
          <>
            {/* Banner Section */}
            <section className="px-gutter-desktop mt-8">
              <div 
                onClick={() => songs.length > 0 && handlePlaySong(songs[0], songs)}
                className="relative h-[380px] rounded-3xl overflow-hidden group cursor-pointer shadow-2xl"
              >
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqLbsgkRut0bnI7FP6rdekR522YrvrZ2s01Ke-M9mNvaPZrVmbULpghio_OESq9zWrEp7PAxJEiMRgBx9F1J8cXHzHPsfYREG6ijnEn8gZ5H6XH83OOSVOWXaeO8J-GN6t26N3GBf65x_5Y9_WBFqexjCaCp0AUW-A659htQ8mh-_cHpl0iZKClpoGypDnuQtpwgvXoOdSOQV9Oa17ntfqpe-JfFlF4Si1yM4_c3s-a-lL4WV62kU8wnKgAKJB7SjDL6sMwz1E_LA" 
                  alt="Release banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                <div className="absolute bottom-12 left-12 max-w-2xl z-10">
                  <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md font-label-sm text-label-sm mb-4">
                    {t("MỚI PHÁT HÀNH")}
                  </span>
                  <h2 className="font-headline-xl text-headline-xl text-white mb-4">{t("Âm Thanh Của Tương Lai")}</h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 line-clamp-2">
                    {t('Khám phá album mới nhất từ nhóm nhạc indie-electronic "Ethereal Echoes". Một hành trình âm nhạc xuyên không gian và thời gian.')}
                  </p>
                  <div className="flex gap-4">
                    <button className="px-8 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer font-bold">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      {t("Nghe Ngay")}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/library-playlists'); }}
                      className="px-8 py-3 rounded-full glass-panel text-white font-label-md text-label-md hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {t("Xem Thư Viện")}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Suggestions list */}
            <section className="px-gutter-desktop mt-margin-page">
              <div className="flex justify-between items-end mb-6">
                <h3 className="font-headline-lg text-headline-lg text-white font-bold">{t("Gợi Ý Cho Bạn")}</h3>
                <span className="text-primary font-label-md text-label-md hover:underline cursor-default">{t("Phù hợp sở thích")}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {songs.slice(0, 5).map(song => (
                  <div 
                    key={song._id}
                    onClick={() => handlePlaySong(song, songs)}
                    className="group cursor-pointer bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden relative mb-4 shadow-lg">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        src={getFullUrl(song.thumbnailUrl)} 
                        alt={song.title}
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary scale-90 group-hover:scale-100 transition-transform">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-label-md text-label-md text-white truncate font-bold">{song.title}</h4>
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (song.artistId) navigate(`/artist-detail?id=${song.artistId}`);
                      }}
                      className="font-label-sm text-label-sm text-on-surface-variant truncate hover:text-primary transition-colors cursor-pointer"
                    >
                      {song.artist}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Charts & Releases Split */}
            <section className="px-gutter-desktop mt-margin-page grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Top Charts */}
              <div className="lg:col-span-6">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="font-headline-lg text-headline-lg text-white font-bold">{t("Bảng Xếp Hạng")}</h3>
                  <span className="text-primary font-label-md text-label-md cursor-default">{t("Top Lượt Nghe")}</span>
                </div>
                <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/5">
                  {charts.map((song, i) => (
                    <div 
                      key={song._id}
                      onClick={() => handlePlaySong(song, charts)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                    >
                      <span className="w-8 font-headline-md text-headline-md text-on-surface-variant opacity-40 text-center font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                      </div>
                      <div className="flex-grow min-w-0">
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
                      </div>
                      <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:block">
                        {song.views.toLocaleString()} {t("lượt nghe")}
                      </span>
                      <button className="text-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newly Released list */}
              <div className="lg:col-span-6">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="font-headline-lg text-headline-lg text-white font-bold">{t("Mới Cập Nhật")}</h3>
                  <span className="text-primary font-label-md text-label-md cursor-default">{t("Mới Nhất")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {songs.slice(0, 6).map(song => (
                    <div 
                      key={song._id}
                      onClick={() => handlePlaySong(song, songs)}
                      className="glass-panel p-4 rounded-2xl flex gap-4 items-center group cursor-pointer hover:bg-white/10 transition-all"
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
              </div>
            </section>

            {/* Listener Stats banner */}
            <section className="px-gutter-desktop mt-margin-page mb-12">
              <div className="glass-panel rounded-3xl p-8 overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="max-w-md">
                    <h3 className="font-headline-lg text-headline-lg text-white mb-2 font-bold">{t("Chào mừng trở lại,")} {user?.name}!</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {t("Bạn đã đăng nhập hệ thống với vai trò")} <span className="text-primary font-bold uppercase">{user?.role}</span>. {t("Khám phá hàng ngàn giai điệu và quản lý trải nghiệm cá nhân của mình ngay hôm nay.")}
                    </p>
                    <button 
                      onClick={() => navigate('/library-playlists')}
                      className="mt-6 px-6 py-2 rounded-full border border-primary text-primary font-label-md text-label-md hover:bg-primary/10 transition-all cursor-pointer"
                    >
                      {t("Xem danh sách phát của tôi")}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 bg-primary/20 h-32 rounded-t-lg relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full bg-primary h-24"></div>
                      </div>
                      <span className="font-label-sm text-label-sm mt-2 text-white">Pop</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 bg-secondary/20 h-32 rounded-t-lg relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full bg-secondary h-16"></div>
                      </div>
                      <span className="font-label-sm text-label-sm mt-2 text-white">Lo-fi</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 bg-tertiary-container/20 h-32 rounded-t-lg relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full bg-tertiary-container h-28"></div>
                      </div>
                      <span className="font-label-sm text-label-sm mt-2 text-white">Indie</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
              </div>
            </section>
          </>
        )}
      </main>

      <MusicPlayer />
    </>
  );
};

export default Home;
