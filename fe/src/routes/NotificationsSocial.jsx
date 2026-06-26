import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';

export default function NotificationsSocial() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          <div>
            <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">notifications</span>
              Trung tâm Thông báo
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Cập nhật các hoạt động mới nhất từ nghệ sĩ bạn quan tâm và cảnh báo hệ thống.
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-3">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif._id}
                    className={`p-4 rounded-2xl flex items-start gap-4 transition border ${
                      notif.isRead 
                        ? 'bg-white/[0.01] border-white/5 opacity-75' 
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mt-0.5 ${
                      notif.type === 'new_track' ? 'text-tertiary' : notif.type === 'admin' ? 'text-error' : 'text-secondary-container'
                    }`}>
                      {notif.type === 'new_track' ? 'library_music' : notif.type === 'admin' ? 'warning' : 'campaign'}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-sm font-bold text-white ${!notif.isRead ? 'text-secondary-container' : ''}`}>{notif.title}</p>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkRead(notif._id)}
                            className="text-[9px] font-bold text-secondary-container hover:underline cursor-pointer"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-on-surface-variant">Không có thông báo mới nào.</div>
              )}
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
