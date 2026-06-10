import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const NotificationsSocial = () => {
  const { setHasUnread } = useAuth();
  const { play } = usePlayer();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications and some songs (for mock friends playback activity)
  const fetchData = useCallback(async () => {
    try {
      const notifData = await api.get('/notifications');
      const notifs = notifData.notifications || [];
      setNotifications(notifs);
      setHasUnread(notifs.some(n => !n.read));
      
      const songsData = await api.get('/songs');
      setSongs(songsData.songs || []);
    } catch (err) {
      console.error('Failed to load notifications or songs:', err);
    } finally {
      setLoading(false);
    }
  }, [setHasUnread]);

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      // Update state locally
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setHasUnread(false);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update state locally
      setNotifications(prev => {
        const updated = prev.map(n => n._id === id ? { ...n, read: true } : n);
        setHasUnread(updated.some(n => !n.read));
        return updated;
      });
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark single notification as read:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return t('Hôm nay');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
 
    if (diffMins < 1) return t('Vừa xong');
    if (diffMins < 60) return `${diffMins} ${t('phút trước')}`;
    if (diffHours < 24) return `${diffHours} ${t('giờ trước')}`;
    return `${diffDays} ${t('ngày trước')}`;
  };

  // Mock friends data that uses actual songs in the system
  const friends = [
    {
      name: 'Linh Chi',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSH9ZDASmNtIPxIjYPnt2cuXAlZnMRMerUErny28-nq0cLq4NK1EdY3UJkaMNi3bKqIITzONuQJ-sbodfHejL_6DsWRovSc35TDCm9XUJb4qkx35KLtPHogiC-EjUqi_7HbHCYHiektOTLECfgTIoFj1r3gmIsp0kQXKg-0c82bOZ-PT4NtnoOVy5iQPx3fSYASeDnQ2O89PjpyRV5pDv1B0Cy7sDQwTcR76c6TJSQEOancGErFASjrmTsGNvnsRWK3S4vcrzt2uA',
      song: songs[0] || null,
      defaultSongTitle: 'Midnight Pulse',
      defaultSongArtist: 'Neon Velocity',
      active: true,
      time: t('Đang nghe')
    },
    {
      name: 'Hoàng Nam',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC737jAD5SvmDRkNwgrQhtuu0Cm1gEDlfSsOpJ5BtETXUuA7HnI9jVhEVUsGnM8RdIJCo3PEj842STf1yWRRWIfF9S2Dvn3vTHfAcEat7EjuZZUJBtsBsOb4GCR4FcBX1NR6vtVBq7PFFS7uGkXOlz_p7kunbCXxTKkcGQjhnW1mGFB964ORfSdv7xCA1u3Xcl8Nn6SCoQZxpPMCYmP32I5Ftmp6_HBBIHnpQetAH8g8QSSFVCbgJC-eKFiZgUR2gZY7YcbwGLSeqo',
      song: songs[1] || null,
      defaultSongTitle: 'Concrete Jungle',
      defaultSongArtist: 'The Architects',
      active: false,
      time: t('5 phút trước')
    },
    {
      name: 'Minh Anh',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQzLxZ-ZZ55ym3kTm4b2liWbVIM1e2sjMUtr5aeCOHQ1brzZG5MvGMzE_I9C7vW725Eg8yhZYByWC4G_b8L4pVMHeOo2Sf-ay67-bu60DIhhR-ifvEdd_za5BBPkCeq8kOEDPT4Dz2-K28HPuWYhomrA1Blw6EbF6Eq19ImMrTX2nTujrBgaODv-pDWUvc2m5xdTBfb78cbIf-gjbERNaKLHj3Fs1AFt4WDeSAvTtIaz3Zfu4hbZHK39sAiSq6nFvx5f5gsD1uL9Q',
      song: songs[2] || null,
      defaultSongTitle: 'Vapor Wave',
      defaultSongArtist: 'Digital Muse',
      active: true,
      time: t('Đang nghe')
    },
    {
      name: 'Quốc Trung',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeh23yPc_KerILMaLuwW2zn2IrBzs0zXdgRF_AFBQt6_Y9pR89qRuBVgy6q8zFeqmnXSeyd98B1zwpQA0WBOp6UIi2zyb0E8pWqak4y712DViK_5AtYvoFM02kg1MpvJkV6_k4C2o5OnwGJMSA5Mi5loWVRIjerwhbMFxGmbwH9CsIooLw1Z7m-VFXYfzB5R2ioqqGTFUkDCUjMKI1ESk6RszZtvfi0sbk0HyJjTu15_qkdV6qhfTlRKeaGc3Zb3KY-4spjLoLPo4',
      song: songs[3] || null,
      defaultSongTitle: 'Thanh Xuân',
      defaultSongArtist: 'Da LAB',
      active: false,
      time: t('1 giờ trước')
    }
  ];

  const handlePlayFriendSong = (friend) => {
    if (friend.song) {
      play(friend.song, songs);
    }
  };

  return (
    <>
      <Sidebar />
      
      <main className="md:ml-sidebar-width pb-[120px] min-h-screen bg-background text-on-background">
        <Header placeholder={t("Tìm kiếm bài hát, thông báo...")} />

        <div className="max-w-7xl mx-auto px-gutter-desktop py-margin-page grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Notifications Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-headline-lg text-white font-bold">{t("Thông báo")}</h2>
              {notifications.some(n => !n.read) && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-primary hover:text-secondary font-label-md text-label-md transition-all cursor-pointer font-bold"
                >
                  {t("Đánh dấu tất cả là đã đọc")}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-primary">
                <span className="material-symbols-outlined text-3xl animate-spin mr-2">sync</span>
                <span>{t("Đang tải thông báo...")}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-50">notifications_off</span>
                <p className="font-body-lg text-body-lg">{t("Bạn không có thông báo nào mới.")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(notif => (
                  <div 
                    key={notif._id}
                    onClick={() => handleMarkRead(notif._id, notif.link)}
                    className={`glass-panel p-6 rounded-2xl flex gap-4 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden ${
                      !notif.read ? 'border-l-4 border-primary' : 'opacity-70'
                    }`}
                  >
                    {/* Icon depending on type */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-2xl">
                        {notif.type === 'new_track' ? 'library_music' : notif.type === 'follow' ? 'person_add' : 'notifications'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-label-md text-label-md text-white font-bold truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-on-surface-variant shrink-0 font-mono">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-body-md mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <span className="inline-block mt-3 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                          {t("Mới")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social / Friends Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-white font-bold">{t("Hoạt động bạn bè")}</h3>
              <span className="material-symbols-outlined text-on-surface-variant">group</span>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className="p-6 space-y-6">
                {friends.map((friend, idx) => (
                  <div 
                    key={idx}
                    onClick={() => friend.song && handlePlayFriendSong(friend)}
                    className={`flex items-center gap-4 ${
                      friend.song ? 'cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-all' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                        friend.active ? 'border-secondary active-glow' : 'border-white/10'
                      }`}>
                        <img alt={friend.name} className="w-full h-full object-cover" src={friend.avatar} />
                      </div>
                      {friend.active && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-white truncate font-bold">{friend.name}</p>
                      {friend.active ? (
                        <p className="text-label-sm text-on-surface-variant truncate">
                          {t("Đang nghe")}: <span className="text-secondary italic">"{friend.song ? friend.song.title : friend.defaultSongTitle}"</span>
                        </p>
                      ) : (
                        <p className="text-label-sm text-on-surface-variant truncate">
                          {t("Đã nghe")}: <span className="text-on-surface-variant/70 italic">"{friend.song ? friend.song.title : friend.defaultSongTitle}"</span> ({friend.time})
                        </p>
                      )}
                    </div>

                    {friend.active && (
                      <span className="material-symbols-outlined text-primary text-xl animate-pulse">equalizer</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MusicPlayer />
    </>
  );
};

export default NotificationsSocial;
