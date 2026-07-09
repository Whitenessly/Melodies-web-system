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
              <span className="material-symbols-outlined text-primary">notifications</span>
              Trung tâm Thông báo
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
              Cập nhật các hoạt động mới nhất từ nghệ sĩ bạn quan tâm và cảnh báo hệ thống.
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            </div>
          ) : (
            <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-3 shadow-md">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif._id}
                    className={`p-4 rounded-2xl flex items-start gap-4 transition duration-150 border ${
                      notif.isRead 
                        ? 'bg-[#121212]/40 border-white/5 opacity-70' 
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mt-0.5 ${
                      notif.type === 'new_track' ? 'text-primary font-bold' : notif.type === 'admin' ? 'text-red-500 font-bold' : 'text-primary'
                    }`}>
                      {notif.type === 'new_track' ? 'library_music' : notif.type === 'admin' ? 'warning' : 'campaign'}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-sm font-bold text-white ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkRead(notif._id)}
                            className="text-[10px] bg-primary text-black px-3.5 py-1 rounded-full font-extrabold hover:scale-105 active:scale-95 transition cursor-pointer"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-on-surface-variant font-medium">Không có thông báo mới nào.</div>
              )}
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
