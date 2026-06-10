import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const UploadManage = () => {
  const { t } = useLanguage();
  
  const [categories, setCategories] = useState([]);
  const [artistSongs, setArtistSongs] = useState([]);
  const [, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [audioBase64, setAudioBase64] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Progress tracker
  const [progress, setProgress] = useState(0);

  // Edit Song States
  const [editingSong, setEditingSong] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');
  const [editLyrics, setEditLyrics] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchArtistData = async () => {
    try {
      const catData = await api.get('/categories');
      setCategories(catData.categories || []);

      const statsData = await api.get('/users/artist/stats');
      setArtistSongs(statsData.songs || []);
    } catch (err) {
      console.error('Failed to fetch artist upload data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchArtistData());
  }, []);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !genre || !audioBase64 || !imageBase64) {
      setMessage(t('Vui lòng điền đầy đủ tiêu đề, thể loại và chọn file âm thanh, ảnh đại diện.'));
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress(15);

    try {
      setProgress(45);
      await api.post('/songs', {
        title,
        genre,
        lyrics,
        visibility,
        audio: audioBase64,
        image: imageBase64
      });
      
      setProgress(100);
      setMessage(t('Tải bài hát lên thành công! Đang chờ kiểm duyệt từ Admin.'));
      
      // Reset form
      setTitle('');
      setGenre('');
      setLyrics('');
      setAudioBase64('');
      setAudioFileName('');
      setImageBase64('');

      // Reload list
      fetchArtistData();
    } catch (err) {
      console.error(err);
      setMessage(err.message || t('Tải bài hát lên thất bại.'));
    } finally {
      setUploading(false);
    }
  };

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
      fetchArtistData();
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
      fetchArtistData();
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

      <main className="md:ml-sidebar-width pb-[120px] bg-background min-h-screen">
        <Header placeholder={t("Tìm kiếm trong kho bài hát...")} />

        <div className="max-w-6xl mx-auto px-margin-page py-10 relative">
          <header className="mb-10">
            <h2 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">{t("Tải lên bài hát mới")}</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              {t("Chia sẻ tác phẩm âm nhạc mới của bạn. Tác phẩm chất lượng cao của bạn xứng đáng một ngôi nhà cao cấp.")}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <section className="lg:col-span-2 space-y-8">
              <div className="glass-panel rounded-2xl p-8 border border-white/5 shadow-xl">
                <form onSubmit={handlePublish} className="space-y-6">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Tên bài hát")}</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none" 
                      placeholder={t("Nhập tên bài hát...")} 
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Thể loại")}</label>
                      <select 
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
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
                      <div className="flex gap-4">
                        <label className="flex-grow flex items-center justify-between p-3.5 bg-surface-container-lowest/30 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">public</span>
                            <span className="text-body-md text-white">{t("Công khai")} (Public)</span>
                          </div>
                          <input 
                            type="radio" 
                            name="visibility" 
                            value="public"
                            checked={visibility === 'public'}
                            onChange={() => setVisibility('public')}
                            className="text-primary focus:ring-primary bg-transparent border-outline-variant/50 w-5 h-5 cursor-pointer"
                          />
                        </label>
                        <label className="flex-grow flex items-center justify-between p-3.5 bg-surface-container-lowest/30 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">lock</span>
                            <span className="text-body-md text-white">{t("Riêng tư")} (Private)</span>
                          </div>
                          <input 
                            type="radio" 
                            name="visibility" 
                            value="private"
                            checked={visibility === 'private'}
                            onChange={() => setVisibility('private')}
                            className="text-primary focus:ring-primary bg-transparent border-outline-variant/50 w-5 h-5 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">{t("Lời bài hát (Tùy chọn)")}</label>
                    <textarea 
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows="4"
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none resize-none"
                      placeholder={t("Viết lời bài hát tại đây...")}
                    />
                  </div>

                  {/* Upload components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio upload */}
                    <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors group relative cursor-pointer bg-surface-container-low/20 min-h-[200px]">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">cloud_upload</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface mb-1 font-bold">Audio File</p>
                      <p className="text-[11px] text-on-surface-variant mb-4">{t("Click để chọn file .mp3 hoặc .wav")}</p>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        required={!audioBase64}
                      />
                      {audioBase64 && (
                        <div className="relative z-10 flex flex-col items-center gap-1.5 mt-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 max-w-full">
                          <p className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">{t("File đã tải lên thành công")}</p>
                          <p className="text-[11px] text-on-surface font-semibold truncate max-w-[200px]" title={audioFileName}>{audioFileName}</p>
                        </div>
                      )}
                    </div>

                    {/* Image thumbnail upload */}
                    <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-secondary/50 transition-colors group relative cursor-pointer bg-surface-container-low/20 overflow-hidden min-h-[200px]">
                      {imageBase64 ? (
                        <>
                          <img 
                            src={imageBase64} 
                            alt="Cover Preview" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mb-2 shadow-md">
                              <span className="material-symbols-outlined text-secondary text-sm">edit</span>
                            </div>
                            <p className="text-xs font-bold text-white mb-1.5">{t("Thay đổi ảnh bìa")}</p>
                            <p className="text-[10px] bg-secondary/35 text-secondary px-3 py-1 rounded-full font-bold shadow-lg">{t("Ảnh đã tải lên thành công")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-secondary">image</span>
                          </div>
                          <p className="font-label-md text-label-md text-on-surface mb-1 font-bold">Cover Thumbnail</p>
                          <p className="text-[11px] text-on-surface-variant mb-4">{t("Click để chọn ảnh bìa (Tỷ lệ 1:1)")}</p>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        required={!imageBase64}
                      />
                    </div>
                  </div>

                  {message && (
                    <p className={`text-label-sm font-semibold ${message.includes('thành công') ? 'text-secondary' : 'text-error'}`}>
                      {message}
                    </p>
                  )}

                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-md text-headline-md font-bold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer mt-4 flex items-center justify-center"
                  >
                    {uploading ? `${t("Đang xuất bản")} (${progress}%)` : t('Xuất bản bài hát')}
                  </button>
                </form>
              </div>

              {/* Progress bar inside form */}
              {uploading && (
                <div className="glass-panel rounded-2xl p-6 border border-primary/20 bg-primary/5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary animate-pulse">sync</span>
                      <p className="font-label-md text-label-md text-on-surface">{t("Đang xử lý file nhạc...")}</p>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(221,183,255,0.5)] transition-all duration-300"
                    ></div>
                  </div>
                </div>
              )}
            </section>

            {/* Sidebar list of recent uploads */}
            <aside className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-xl max-h-[640px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline-md text-headline-md text-white font-bold">{t("Bài hát đã đăng")}</h3>
                  <span className="text-secondary text-label-sm font-bold">{artistSongs.length} {t('bài hát')}</span>
                </div>
                
                <div className="space-y-4">
                  {artistSongs.length > 0 ? (
                    artistSongs.map(song => (
                      <div 
                        key={song._id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-outline-variant/20 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0">
                          <img className="w-full h-full object-cover" src={getFullUrl(song.thumbnailUrl)} alt={song.title} />
                        </div>
                        <div className="flex-grow overflow-hidden min-w-0">
                          <p className="font-label-md text-label-md text-white truncate font-bold">{song.title}</p>
                          <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded ${song.moderationState === 'approved' ? 'bg-green-500/20 text-green-400' : song.moderationState === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {song.moderationState === 'approved' ? t('Đã duyệt') : song.moderationState === 'pending' ? t('Chờ duyệt') : t('Bị chặn')}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleStartEdit(song)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title={t("Chỉnh sửa")}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant text-label-sm">{t("Bạn chưa tải lên bài hát nào.")}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
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

export default UploadManage;
