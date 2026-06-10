import { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalUsers: 0, totalSongs: 0, totalAlbums: 0, totalStreams: 0, cpuLoad: 24.8, latency: 14 });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginated songs state
  const [allSongs, setAllSongs] = useState([]);
  const [totalSongs, setTotalSongs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);

  const [previewingId, setPreviewingId] = useState(null);
  const audioPlayerRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioPlayerRef.current;
    const handleEnded = () => {
      setPreviewingId(null);
    };
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const handleTogglePreview = (song) => {
    const audio = audioPlayerRef.current;
    const fullUrl = song.audioUrl.startsWith('http') ? song.audioUrl : `http://localhost:8080${song.audioUrl}`;
    if (previewingId === song._id) {
      audio.pause();
      setPreviewingId(null);
    } else {
      audio.src = fullUrl;
      audio.play().catch(err => console.error("Preview failed:", err));
      setPreviewingId(song._id);
    }
  };

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

  const fetchPaginatedSongs = async () => {
    setLoadingSongs(true);
    try {
      const data = await api.get(`/admin/songs?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
      setAllSongs(data.songs || []);
      setTotalSongs(data.totalSongs || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch paginated songs:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchAdminData());
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchPaginatedSongs());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const handleApprove = async (songId) => {
    try {
      if (previewingId === songId) {
        audioPlayerRef.current.pause();
        setPreviewingId(null);
      }
      await api.put(`/admin/moderation/${songId}/approve`);
      // Reload lists
      fetchAdminData();
      fetchPaginatedSongs();
    } catch (err) {
      console.error(err);
      alert(t('Phê duyệt bài hát thất bại.'));
    }
  };

  const handleBlock = async (songId) => {
    try {
      if (previewingId === songId) {
        audioPlayerRef.current.pause();
        setPreviewingId(null);
      }
      await api.put(`/admin/moderation/${songId}/block`);
      // Reload lists
      fetchAdminData();
      fetchPaginatedSongs();
    } catch (err) {
      console.error(err);
      alert(t('Chặn bài hát thất bại.'));
    }
  };

  const handleApproveAll = async () => {
    if (pendingSongs.length === 0) return;
    try {
      for (const song of pendingSongs) {
        await api.put(`/admin/moderation/${song._id}/approve`);
      }
      fetchAdminData();
      fetchPaginatedSongs();
    } catch (err) {
      console.error(err);
      alert(t('Phê duyệt đồng loạt gặp sự cố.'));
    }
  };

  const handleToggleModeration = async (song) => {
    try {
      if (previewingId === song._id) {
        audioPlayerRef.current.pause();
        setPreviewingId(null);
      }
      if (song.moderationState === 'approved') {
        await api.put(`/admin/moderation/${song._id}/block`);
      } else {
        await api.put(`/admin/moderation/${song._id}/approve`);
      }
      fetchAdminData();
      fetchPaginatedSongs();
    } catch (err) {
      console.error(err);
      alert(t('Cập nhật trạng thái bài hát thất bại.'));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pb-32 bg-background min-h-screen">
        <Header placeholder={t("Tìm kiếm hệ thống...")} />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>{t("Đang tải bảng điều khiển Admin...")}</span>
          </div>
        ) : (
          <div className="px-gutter-mobile md:px-margin-page py-10 max-w-7xl mx-auto">
            <header className="mb-10">
              <h1 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">{t("Hệ thống Quản trị")}</h1>
              <p className="text-on-surface-variant font-body-lg text-body-lg">
                {t("Giám sát thời gian thực và điều phối nội dung Melodies.")}
              </p>
            </header>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-7xl text-primary">group</span>
                </div>
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">{t("Người dùng")}</h3>
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
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">{t("Lượt stream")}</h3>
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
                <h3 className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-2">{t("Tải CPU hệ thống")}</h3>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">{stats.cpuLoad}%</span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm mb-1">{t("Tối ưu")}</span>
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
                    <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Hạ tầng Toàn cầu")}</h2>
                    <p className="text-on-surface-variant text-label-md">{t("Thời gian hoạt động (Uptime) trong 24 giờ qua")}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-surface-container-highest rounded-lg text-label-sm text-white font-bold">{t("Tuần này")}</span>
                    <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-label-sm font-bold">{t("Thời gian thực")}</span>
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
                  <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Sự cố Bảo mật")}</h2>
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
                    <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Hàng đợi Kiểm duyệt Nội dung")}</h2>
                    <p className="text-on-surface-variant text-label-md">
                      {t("Đang chờ xử lý")}: <span className="text-tertiary font-bold">{pendingSongs.length} {t("mục")}</span>
                    </p>
                  </div>
                  {pendingSongs.length > 0 && (
                    <button 
                      onClick={handleApproveAll}
                      className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-label-md hover:bg-primary/30 transition-all font-bold cursor-pointer"
                    >
                      {t("Phê duyệt tất cả")}
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {pendingSongs.length > 0 ? (
                    <table className="w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-on-surface-variant text-label-sm uppercase tracking-wider">
                          <th className="pb-2 px-4">{t("Tác phẩm")}</th>
                          <th className="pb-2 px-4">{t("Nghệ sĩ")}</th>
                          <th className="pb-2 px-4">{t("Quyền truy cập")}</th>
                          <th className="pb-2 px-4 text-right">{t("Thao tác")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSongs.map(song => (
                          <tr key={song._id} className="group hover:bg-white/5 transition-colors bg-white/2">
                            <td className="py-4 px-4 rounded-l-2xl">
                              <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0 group/preview">
                                  <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePreview(song);
                                    }}
                                    className={`absolute inset-0 bg-black/55 flex items-center justify-center transition-all cursor-pointer ${
                                      previewingId === song._id ? 'opacity-100' : 'opacity-0 group-hover/preview:opacity-100'
                                    }`}
                                    title={previewingId === song._id ? t("Tạm dừng nghe thử") : t("Nghe thử")}
                                  >
                                    <span className="material-symbols-outlined text-white text-2xl">
                                      {previewingId === song._id ? 'pause' : 'play_arrow'}
                                    </span>
                                  </button>
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
                                  title={t("Chặn bài hát")}
                                >
                                  <span className="material-symbols-outlined">block</span>
                                </button>
                                <button 
                                  onClick={() => handleApprove(song._id)}
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
                                  title={t("Phê duyệt bài hát")}
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
                      <p className="font-body-md">{t("Sạch sẽ! Không có bài hát nào đang chờ kiểm duyệt.")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* All Songs Management Section */}
              <div className="lg:col-span-12 glass-panel p-8 rounded-3xl border border-white/5 bg-white/5 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Danh sách toàn bộ bài hát")}</h2>
                    <p className="text-on-surface-variant text-label-md">
                      {t("Tổng số")}: <span className="text-primary font-bold">{totalSongs} {t("bài hát")}</span>
                    </p>
                  </div>

                  {/* Search and Limit controls */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-grow sm:flex-grow-0">
                      <div className="relative flex-grow">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-lg">search</span>
                        <input
                          type="text"
                          placeholder={t("Tìm kiếm bài hát, nghệ sĩ...")}
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full sm:w-[240px] bg-surface-container-lowest/40 border border-outline-variant/30 rounded-xl text-body-md text-white focus:border-primary/50 transition-all outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-label-md cursor-pointer"
                      >
                        {t("Tìm")}
                      </button>
                    </form>

                    <div className="flex items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{t("Hiển thị")}:</span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(parseInt(e.target.value));
                          setPage(1);
                        }}
                        className="bg-surface-container-high border-none rounded-xl text-label-sm text-on-surface py-2 px-3 outline-none cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loadingSongs ? (
                    <div className="flex items-center justify-center py-12 text-primary">
                      <span className="material-symbols-outlined text-3xl animate-spin mr-2">sync</span>
                      <span>{t("Đang tải danh sách bài hát...")}</span>
                    </div>
                  ) : allSongs.length > 0 ? (
                    <table className="w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-on-surface-variant text-label-sm uppercase tracking-wider">
                          <th className="pb-2 px-4">{t("Tác phẩm")}</th>
                          <th className="pb-2 px-4">{t("Nghệ sĩ")}</th>
                          <th className="pb-2 px-4">{t("Trạng thái")}</th>
                          <th className="pb-2 px-4">{t("Lượt nghe")}</th>
                          <th className="pb-2 px-4 text-right">{t("Thao tác")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSongs.map(song => (
                          <tr key={song._id} className="group hover:bg-white/5 transition-colors bg-white/2">
                            <td className="py-4 px-4 rounded-l-2xl">
                              <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0 group/preview">
                                  <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePreview(song);
                                    }}
                                    className={`absolute inset-0 bg-black/55 flex items-center justify-center transition-all cursor-pointer ${
                                      previewingId === song._id ? 'opacity-100' : 'opacity-0 group-hover/preview:opacity-100'
                                    }`}
                                    title={previewingId === song._id ? t("Tạm dừng nghe thử") : t("Nghe thử")}
                                  >
                                    <span className="material-symbols-outlined text-white text-2xl">
                                      {previewingId === song._id ? 'pause' : 'play_arrow'}
                                    </span>
                                  </button>
                                </div>
                                <div>
                                  <p className="text-white font-bold truncate max-w-[180px]" title={song.title}>{song.title}</p>
                                  <p className="text-on-surface-variant text-label-sm italic">{song.genre}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-on-surface font-bold">
                              {song.artistId?.name || song.artist}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                                song.moderationState === 'approved' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : song.moderationState === 'pending' 
                                    ? 'bg-yellow-500/20 text-yellow-400' 
                                    : 'bg-red-500/20 text-red-400'
                              }`}>
                                {song.moderationState === 'approved' 
                                  ? t('Được duyệt') 
                                  : song.moderationState === 'pending' 
                                    ? t('Chờ duyệt') 
                                    : t('Bị chặn')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-on-surface font-semibold text-label-md">
                              {(song.views || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 rounded-r-2xl text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setSelectedSongDetails(song)}
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                  title={t("Chi tiết thông tin")}
                                >
                                  <span className="material-symbols-outlined text-body-lg">info</span>
                                </button>
                                
                                {song.moderationState === 'approved' ? (
                                  <button 
                                    onClick={() => handleToggleModeration(song)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-error hover:bg-error/15 transition-colors cursor-pointer"
                                    title={t("Chặn bài hát")}
                                  >
                                    <span className="material-symbols-outlined text-body-lg">block</span>
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleToggleModeration(song)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/15 transition-colors cursor-pointer"
                                    title={t("Cho phép bài hát")}
                                  >
                                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 text-on-surface-variant bg-white/2 rounded-2xl">
                      <span className="material-symbols-outlined text-5xl mb-3">music_note</span>
                      <p className="font-body-md">{t("Không tìm thấy bài hát nào.")}</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
                    <span className="text-label-sm text-on-surface-variant">
                      {t("Hiển thị trang")} {page} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                        title={t("Trang trước")}
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                        title={t("Trang sau")}
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Song Details Modal */}
      {selectedSongDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-headline-md text-headline-md text-white font-bold">{t("Thông tin chi tiết bài hát")}</h3>
              <button 
                type="button"
                onClick={() => setSelectedSongDetails(null)}
                className="text-on-surface-variant hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              <div className="w-48 h-48 rounded-2xl bg-surface-container-highest overflow-hidden flex-shrink-0 mx-auto md:mx-0 border border-white/10 shadow-lg">
                <img className="w-full h-full object-cover" src={getFullUrl(selectedSongDetails.thumbnailUrl)} alt={selectedSongDetails.title} />
              </div>

              {/* Info Details */}
              <div className="flex-grow space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-1">{selectedSongDetails.title}</h4>
                  <p className="text-primary font-bold text-body-lg">{selectedSongDetails.artistId?.name || selectedSongDetails.artist}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t("Thể loại")}</p>
                    <p className="text-white font-semibold">{selectedSongDetails.genre}</p>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t("Trạng thái")}</p>
                    <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-[9px] font-bold uppercase ${
                      selectedSongDetails.moderationState === 'approved' 
                        ? 'bg-green-500/20 text-green-400' 
                        : selectedSongDetails.moderationState === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedSongDetails.moderationState === 'approved' 
                        ? t('Được duyệt') 
                        : selectedSongDetails.moderationState === 'pending' 
                          ? t('Chờ duyệt') 
                          : t('Bị chặn')}
                    </span>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t("Lượt nghe")}</p>
                    <p className="text-white font-semibold">{(selectedSongDetails.views || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">{t("Quyền truy cập")}</p>
                    <p className="text-white font-semibold uppercase">{selectedSongDetails.visibility}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lyrics Section */}
            {selectedSongDetails.lyrics && (
              <div className="space-y-2">
                <h5 className="font-label-md text-label-md text-white font-bold uppercase tracking-wider">{t("Lời bài hát")}</h5>
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 max-h-[160px] overflow-y-auto custom-scrollbar text-on-surface-variant text-body-md whitespace-pre-line leading-relaxed italic">
                  {selectedSongDetails.lyrics}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <div className="flex-grow"></div>
              
              {selectedSongDetails.moderationState === 'approved' ? (
                <button
                  onClick={() => {
                    handleToggleModeration(selectedSongDetails);
                    setSelectedSongDetails(null);
                  }}
                  className="px-6 py-3 bg-error text-on-error rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-error/20 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[20px]">block</span>
                  {t("Chặn bài hát")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleToggleModeration(selectedSongDetails);
                    setSelectedSongDetails(null);
                  }}
                  className="px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-secondary/20 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {t("Cho phép bài hát")}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedSongDetails(null)}
                className="px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                {t("Đóng")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
