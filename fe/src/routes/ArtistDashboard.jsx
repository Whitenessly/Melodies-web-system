import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play } = usePlayer();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState({ totalStreams: 0, followersCount: 0, storageUsed: 0, totalTracks: 0, totalLikes: 0 });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Edit Song States
  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');
  const [editLyrics, setEditLyrics] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchArtistStats = async () => {
    try {
      const data = await api.get('/users/artist/stats');
      setStats(data.stats || { totalStreams: 0, followersCount: 0, storageUsed: 0, totalTracks: 0, totalLikes: 0 });
      setSongs(data.songs || []);

      const catData = await api.get('/categories');
      setCategories(catData.categories || []);
    } catch (err) {
      console.error('Failed to retrieve artist statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchArtistStats());
  }, []);

  const handleStartEdit = (song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditGenre(song.genre);
    setEditVisibility(song.visibility);
    setEditLyrics(song.lyrics || '');
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle || !editGenre) return;
    setSavingEdit(true);
    try {
      await api.put(`/songs/${editingSong._id}`, {
        title: editTitle,
        genre: editGenre,
        visibility: editVisibility,
        lyrics: editLyrics
      });
      setEditingSong(null);
      fetchArtistStats();
    } catch (err) {
      console.error(err);
      alert(t('Cập nhật bài hát thất bại.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/songs/${editingSong._id}`);
      setEditingSong(null);
      setShowDeleteConfirm(false);
      fetchArtistStats();
    } catch (err) {
      console.error(err);
      alert(t('Xóa bài hát thất bại.'));
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width min-h-screen bg-background pb-[120px]">
        <Header placeholder={t("Tìm kiếm dữ liệu...")} />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin mr-2">sync</span>
            <span>{t("Đang tải số liệu thống kê...")}</span>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-margin-page py-10">
            <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">{t("Phân tích Nghệ sĩ")}</h1>
                <p className="text-on-surface-variant font-body-lg text-body-lg">
                  {t("Chào mừng trở lại,")} {user?.name}{t(". Đây là những gì đang diễn ra với âm nhạc của bạn.")}
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/upload-manage')}
                  className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-bold hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-body-md">upload</span>
                  {t("Tải lên bài hát mới")}
                </button>
              </div>
            </section>

            {/* Statistics boxes */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <span className="text-secondary font-bold text-label-sm">+12%</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">{t("Người theo dõi")}</h3>
                  <p className="text-headline-md font-headline-md text-white font-bold">{stats.followersCount.toLocaleString()}</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <span className="text-secondary font-bold text-label-sm">+$420</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">{t("Tiền bản quyền dự kiến")}</h3>
                  <p className="text-headline-md font-headline-md text-white font-bold">${(stats.totalStreams * 0.003).toFixed(2)}</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary/20 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </div>
                  <span className="text-secondary font-bold text-label-sm">+8.4%</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">{t("Tổng lượt nghe")}</h3>
                  <p className="text-headline-md font-headline-md text-white font-bold">{stats.totalStreams.toLocaleString()}</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined filled">favorite</span>
                  </div>
                  <span className="text-secondary font-bold text-label-sm">+15%</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">{t("Lượt thích")}</h3>
                  <p className="text-headline-md font-headline-md text-white font-bold">{(stats.totalLikes || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined">cloud</span>
                  </div>
                  <span className="text-on-surface-variant text-label-sm">{t("Hạn mức: 10GB")}</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">{t("Dung lượng sử dụng")}</h3>
                  <p className="text-headline-md font-headline-md text-white font-bold">{stats.storageUsed} GB</p>
                </div>
              </div>
            </section>

            {/* Growth Graph & Listening Months */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Tăng trưởng Khán giả")}</h2>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary"></span>
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                  </div>
                </div>
                <div className="h-64 flex items-end gap-1 relative border-b border-l border-white/15 pb-4 pl-4">
                  <svg className="absolute inset-0 w-full h-full overflow-hidden p-8" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <path d="M0,150 Q50,130 100,160 T200,80 T300,120 T400,40 T500,90 T600,20" fill="none" stroke="#5de6ff" strokeWidth="2"></path>
                    <path d="M0,180 Q50,160 100,190 T200,120 T300,150 T400,80 T500,130 T600,50" fill="none" stroke="#ddb7ff" strokeWidth="2"></path>
                  </svg>
                  <div className="absolute bottom-0 left-0 w-full flex justify-between items-end text-[10px] text-on-surface-variant font-label-sm uppercase px-8">
                    <span>{t("Tuần 1")}</span>
                    <span>{t("Tuần 2")}</span>
                    <span>{t("Tuần 3")}</span>
                    <span>{t("Tuần 4")}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Lượt nghe theo tháng")}</h2>
                  <select className="bg-surface-container-high border-none rounded-lg text-label-sm text-on-surface py-1 pr-8 outline-none">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="h-64 flex items-end justify-between gap-4 border-b border-l border-white/15 pb-4 pl-4">
                  <div className="flex-1 bg-secondary/15 hover:bg-secondary/35 transition-all rounded-t-lg h-1/2 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">1.2M</div>
                  </div>
                  <div className="flex-1 bg-secondary/15 hover:bg-secondary/35 transition-all rounded-t-lg h-3/4 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">2.4M</div>
                  </div>
                  <div className="flex-1 bg-secondary/15 hover:bg-secondary/35 transition-all rounded-t-lg h-2/3 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">1.8M</div>
                  </div>
                  <div className="flex-1 bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg h-5/6 group relative border-x border-t border-primary/40">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">4.2M</div>
                  </div>
                  <div className="flex-1 bg-secondary/15 hover:bg-secondary/35 transition-all rounded-t-lg h-1/2 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">1.4M</div>
                  </div>
                  <div className="flex-1 bg-secondary/15 hover:bg-secondary/35 transition-all rounded-t-lg h-3/5 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface-container-highest px-2 py-1 rounded text-[10px] transition-opacity text-white">1.6M</div>
                  </div>
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-on-surface-variant font-label-sm uppercase pl-4">
                  <span>{t("Th1")}</span>
                  <span>{t("Th2")}</span>
                  <span>{t("Th3")}</span>
                  <span>{t("Th4")}</span>
                  <span>{t("Th5")}</span>
                  <span>{t("Th6")}</span>
                </div>
              </div>
            </section>

            {/* Recent Uploads Table */}
            <section className="glass-panel rounded-3xl overflow-hidden border border-white/5">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="font-headline-md text-headline-md text-white font-bold">{t("Các bài hát của tôi")}</h2>
                <button 
                  onClick={() => navigate('/upload-manage')}
                  className="text-primary font-label-md text-label-md hover:underline cursor-pointer"
                >
                  {t("Quản lý tải lên")}
                </button>
              </div>
              <div className="overflow-x-auto">
                {songs.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <tr>
                        <th className="px-8 py-4">{t("Tên bài hát")}</th>
                        <th className="px-8 py-4">{t("Thể loại")}</th>
                        <th className="px-8 py-4">{t("Trạng thái")}</th>
                        <th className="px-8 py-4">{t("Lượt nghe")}</th>
                        <th className="px-8 py-4">{t("Lượt thích")}</th>
                        <th className="px-8 py-4 text-right font-bold">{t("Thao tác")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {songs.map(song => (
                        <tr 
                          key={song._id}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => song.moderationState === 'approved' && play(song, songs)}
                        >
                          <td className="px-8 py-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest">
                              <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-primary transition-colors">{song.title}</div>
                              <div className="text-label-sm text-on-surface-variant">{song.visibility === 'public' ? t('Công khai') : t('Riêng tư')}</div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-on-surface-variant font-label-md">
                            {song.genre}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${song.moderationState === 'approved' ? 'bg-green-500/20 text-green-400' : song.moderationState === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {song.moderationState === 'approved' ? t('Đã phát hành') : song.moderationState === 'pending' ? t('Chờ duyệt') : t('Bị chặn')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-on-surface font-label-md font-bold">
                            {song.views.toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-on-surface font-label-md font-bold">
                            {(song.likes || 0).toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => handleStartEdit(song)}
                                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary transition-colors cursor-pointer"
                                title={t("Chỉnh sửa")}
                              >
                                <span className="material-symbols-outlined text-body-md">edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl mb-3">audiotrack</span>
                    <p className="font-body-md">{t("Không có bài hát nào được tìm thấy. Tải nhạc ngay!")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Edit Song Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {showDeleteConfirm ? (
              // Warning box/dialog
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <span className="material-symbols-outlined text-4xl">warning</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-white font-bold">{t("Cảnh báo xóa bài hát")}</h3>
                <p className="text-on-surface-variant text-body-md max-w-sm mx-auto leading-relaxed">
                  {t("Hành động này không thể hoàn tác. Bài hát")} <span className="text-white font-bold">"{editingSong.title}"</span> {t("sẽ bị xóa vĩnh viễn và bị gỡ bỏ khỏi tất cả danh sách phát của người dùng.")}
                </p>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {t("Quay lại")}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-3 bg-error text-on-error rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-error/20"
                  >
                    {t("Xác nhận xóa")}
                  </button>
                </div>
              </div>
            ) : (
              // Edit form
              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h3 className="font-headline-md text-headline-md text-white font-bold">{t("Chỉnh sửa thông tin bài hát")}</h3>
                  <button 
                    type="button"
                    onClick={() => setEditingSong(null)}
                    className="text-on-surface-variant hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Tên bài hát")}</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none" 
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Thể loại")}</label>
                    <select 
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none"
                      required
                    >
                      <option value="">{t("Chọn thể loại")}</option>
                      {categories.map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Chế độ hiển thị")}</label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-between p-2.5 bg-surface-container-lowest/30 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                        <span className="text-xs text-white">{t("Công khai")}</span>
                        <input 
                          type="radio" 
                          name="editVisibility" 
                          value="public"
                          checked={editVisibility === 'public'}
                          onChange={() => setEditVisibility('public')}
                          className="text-primary focus:ring-primary bg-transparent border-outline-variant/50 w-4 h-4 cursor-pointer"
                        />
                      </label>
                      <label className="flex-1 flex items-center justify-between p-2.5 bg-surface-container-lowest/30 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                        <span className="text-xs text-white">{t("Riêng tư")}</span>
                        <input 
                          type="radio" 
                          name="editVisibility" 
                          value="private"
                          checked={editVisibility === 'private'}
                          onChange={() => setEditVisibility('private')}
                          className="text-primary focus:ring-primary bg-transparent border-outline-variant/50 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Lời bài hát")}</label>
                  <textarea 
                    value={editLyrics}
                    onChange={(e) => setEditLyrics(e.target.value)}
                    rows="4"
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3 bg-error/15 text-error rounded-xl font-bold hover:bg-error/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    {t("Xóa")}
                  </button>
                  <div className="flex-grow"></div>
                  <button
                    type="button"
                    onClick={() => setEditingSong(null)}
                    className="px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {t("Hủy")}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/10"
                  >
                    {savingEdit ? t("Đang lưu...") : t("Lưu thay đổi")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <MusicPlayer />
    </>
  );
};

export default ArtistDashboard;
