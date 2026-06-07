import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalSongs: 0, totalAlbums: 0, totalStreams: 0, cpuLoad: 24.8, latency: 14 });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const statsData = await api.get('/admin/stats');
      setStats(statsData.stats || { totalUsers: 0, totalSongs: 0, totalAlbums: 0, totalStreams: 0, cpuLoad: 24.8, latency: 14 });
      setSecurityLogs(statsData.securityLogs || []);

      const modData = await api.get('/admin/moderation');
      setPendingSongs(modData.songs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (songId) => {
    try {
      await api.put(`/admin/moderation/${songId}/approve`);
      // Reload queue
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Phê duyệt bài hát thất bại.');
    }
  };

  const handleBlock = async (songId) => {
    try {
      await api.put(`/admin/moderation/${songId}/block`);
      // Reload queue
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Chặn bài hát thất bại.');
    }
  };

  const handleApproveAll = async () => {
    if (pendingSongs.length === 0) return;
    try {
      for (const song of pendingSongs) {
        await api.put(`/admin/moderation/${song._id}/approve`);
      }
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Phê duyệt đồng loạt gặp sự cố.');
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pt-8 pb-32 bg-background min-h-screen">
        <Header placeholder="Tìm kiếm hệ thống..." />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>Đang tải bảng điều khiển Admin...</span>
          </div>
        ) : (
          <div className="px-gutter-mobile md:px-margin-page py-10 max-w-7xl mx-auto">
            <header className="mb-10">
              <h1 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">Hệ thống Quản trị</h1>
              <p className="text-on-surface-variant font-body-lg text-body-lg">
                Giám sát thời gian thực và điều phối nội dung Melodies.
              </p>
            </header>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-7xl text-primary">group</span>
                </div>
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">Người dùng</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">{stats.totalUsers}</span>
                  <span className="text-secondary font-label-sm text-label-sm mb-1 flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span> +100%
                  </span>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-7xl text-secondary">payments</span>
                </div>
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">Lượt stream</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">{stats.totalStreams.toLocaleString()}</span>
                  <span className="text-secondary font-label-sm text-label-sm mb-1 flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span> +5.4%
                  </span>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-7xl text-tertiary">memory</span>
                </div>
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">Tải CPU hệ thống</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">{stats.cpuLoad}%</span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm mb-1">Tối ưu</span>
                </div>
                <div className="w-full h-1 bg-white/5 mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${stats.cpuLoad}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Uptime metrics */}
              <div className="lg:col-span-8 glass-panel p-6 rounded-3xl flex flex-col min-h-[400px] border border-white/5 bg-white/5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white font-bold">Hạ tầng Toàn cầu</h2>
                    <p className="text-on-surface-variant text-label-md">Thời gian hoạt động (Uptime) trong 24 giờ qua</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-surface-container-highest rounded-lg text-label-sm text-white font-bold">Tuần này</span>
                    <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-label-sm font-bold">Thời gian thực</span>
                  </div>
                </div>
                <div className="flex-grow relative flex items-end gap-2 overflow-hidden pt-10 px-4">
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[80%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[85%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[75%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[90%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/40 rounded-t-lg transition-all hover:brightness-125 h-[98%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[88%]"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg transition-all hover:brightness-125 h-[92%]"></div>
                </div>
                <div className="grid grid-cols-4 mt-6 pt-6 border-t border-white/5 gap-4">
                  <div className="text-center">
                    <p className="text-on-surface-variant text-label-sm uppercase">Singapore</p>
                    <p className="text-secondary font-bold">99.99%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant text-label-sm uppercase">Tokyo</p>
                    <p className="text-secondary font-bold">99.95%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant text-label-sm uppercase">US-West</p>
                    <p className="text-secondary font-bold">100.00%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant text-label-sm uppercase">EU-Central</p>
                    <p className="text-secondary font-bold">99.98%</p>
                  </div>
                </div>
              </div>

              {/* Security Logs */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-3xl overflow-hidden flex flex-col h-[400px] border border-white/5 bg-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-headline-md text-headline-md text-white font-bold">Sự cố Bảo mật</h2>
                  <span className="material-symbols-outlined text-on-surface-variant">security</span>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {securityLogs.map(log => (
                    <div key={log.id} className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className={`w-2.5 h-2.5 mt-2 rounded-full ${log.severity === 'high' ? 'bg-error animate-pulse' : log.severity === 'success' ? 'bg-secondary' : 'bg-primary'}`}></div>
                      <div>
                        <p className="text-white text-label-md font-bold">{log.title}</p>
                        <p className="text-on-surface-variant text-label-sm">IP: {log.ip} • {log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation Queue */}
              <div className="lg:col-span-12 glass-panel p-8 rounded-3xl border border-white/5 bg-white/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white font-bold">Hàng đợi Kiểm duyệt Nội dung</h2>
                    <p className="text-on-surface-variant text-label-md">
                      Đang chờ xử lý: <span className="text-tertiary font-bold">{pendingSongs.length} mục</span>
                    </p>
                  </div>
                  {pendingSongs.length > 0 && (
                    <button 
                      onClick={handleApproveAll}
                      className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-label-md hover:bg-primary/30 transition-all font-bold cursor-pointer"
                    >
                      Phê duyệt tất cả
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {pendingSongs.length > 0 ? (
                    <table className="w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-on-surface-variant text-label-sm uppercase tracking-wider">
                          <th className="pb-2 px-4">Tác phẩm</th>
                          <th className="pb-2 px-4">Nghệ sĩ</th>
                          <th className="pb-2 px-4">Quyền truy cập</th>
                          <th className="pb-2 px-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSongs.map(song => (
                          <tr key={song._id} className="group hover:bg-white/5 transition-colors bg-white/2">
                            <td className="py-4 px-4 rounded-l-2xl">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0">
                                  <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                                </div>
                                <div>
                                  <p className="text-white font-bold">{song.title}</p>
                                  <p className="text-on-surface-variant text-label-sm italic">{song.genre}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface font-bold">
                              {song.artistId?.name || song.artist}
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant uppercase font-semibold text-[10px]">
                              {song.visibility}
                            </td>
                            <td className="py-4 px-4 rounded-r-2xl text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleBlock(song._id)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer"
                                  title="Chặn bài hát"
                                >
                                  <span className="material-symbols-outlined">block</span>
                                </button>
                                <button 
                                  onClick={() => handleApprove(song._id)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
                                  title="Phê duyệt bài hát"
                                >
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 text-on-surface-variant bg-white/2 rounded-2xl">
                      <span className="material-symbols-outlined text-5xl mb-3">verified</span>
                      <p className="font-body-md">Sạch sẽ! Không có bài hát nào đang chờ kiểm duyệt.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default AdminDashboard;
