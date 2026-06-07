import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

const UploadManage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [audioBase64, setAudioBase64] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Progress tracker
  const [progress, setProgress] = useState(0);

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
    fetchArtistData();
  }, []);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      setMessage('Vui lòng điền đầy đủ tiêu đề, thể loại và chọn file âm thanh, ảnh đại diện.');
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
      setMessage('Tải bài hát lên thành công! Đang chờ kiểm duyệt từ Admin.');
      
      // Reset form
      setTitle('');
      setGenre('');
      setLyrics('');
      setAudioBase64('');
      setImageBase64('');

      // Reload list
      fetchArtistData();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Tải bài hát lên thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài hát này?')) return;
    try {
      await api.delete(`/songs/${songId}`);
      fetchArtistData();
    } catch (err) {
      console.error(err);
      alert('Xóa bài hát thất bại.');
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pt-8 pb-[120px] bg-background min-h-screen">
        <Header placeholder="Tìm kiếm trong kho bài hát..." />

        <div className="max-w-6xl mx-auto px-margin-page py-10 relative">
          <header className="mb-10">
            <h2 className="font-headline-xl text-headline-xl text-white mb-2 font-bold">Tải lên bài hát mới</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              Chia sẻ tác phẩm âm nhạc mới của bạn. Tác phẩm chất lượng cao của bạn xứng đáng một ngôi nhà cao cấp.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <section className="lg:col-span-2 space-y-8">
              <div className="glass-panel rounded-2xl p-8 border border-white/5 shadow-xl">
                <form onSubmit={handlePublish} className="space-y-6">
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">Tên bài hát</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none" 
                      placeholder="Nhập tên bài hát..." 
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">Thể loại</label>
                      <select 
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none"
                        required
                      >
                        <option value="">Chọn thể loại</option>
                        {categories.map(c => (
                          <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">Chế độ hiển thị</label>
                      <div className="flex gap-4">
                        <label className="flex-grow flex items-center justify-between p-3.5 bg-surface-container-lowest/30 border border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/50 transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">public</span>
                            <span className="text-body-md text-white">Public</span>
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
                            <span className="text-body-md text-white">Private</span>
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
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">Lời bài hát (Tùy chọn)</label>
                    <textarea 
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows="4"
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary/50 transition-all outline-none resize-none"
                      placeholder="Viết lời bài hát tại đây..."
                    />
                  </div>

                  {/* Upload components */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio upload */}
                    <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors group relative cursor-pointer bg-surface-container-low/20">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">cloud_upload</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface mb-1 font-bold">Audio File</p>
                      <p className="text-[11px] text-on-surface-variant mb-4">Click để chọn file .mp3 hoặc .wav</p>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        required={!audioBase64}
                      />
                      {audioBase64 && (
                        <p className="text-[10px] bg-primary/25 text-primary px-3 py-1 rounded-full font-bold">File đã tải lên thành công</p>
                      )}
                    </div>

                    {/* Image thumbnail upload */}
                    <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-secondary/50 transition-colors group relative cursor-pointer bg-surface-container-low/20">
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-secondary">image</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface mb-1 font-bold">Cover Thumbnail</p>
                      <p className="text-[11px] text-on-surface-variant mb-4">Click để chọn ảnh bìa (Tỷ lệ 1:1)</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        required={!imageBase64}
                      />
                      {imageBase64 && (
                        <p className="text-[10px] bg-secondary/25 text-secondary px-3 py-1 rounded-full font-bold">Ảnh đã tải lên thành công</p>
                      )}
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
                    {uploading ? `Đang xuất bản (${progress}%)` : 'Xuất bản bài hát'}
                  </button>
                </form>
              </div>

              {/* Progress bar inside form */}
              {uploading && (
                <div className="glass-panel rounded-2xl p-6 border border-primary/20 bg-primary/5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary animate-pulse">sync</span>
                      <p className="font-label-md text-label-md text-on-surface">Đang xử lý file nhạc...</p>
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
                  <h3 className="font-headline-md text-headline-md text-white font-bold">Bài hát đã đăng</h3>
                  <span className="text-secondary text-label-sm font-bold">{artistSongs.length} bài hát</span>
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
                            {song.moderationState === 'approved' ? 'Đã duyệt' : song.moderationState === 'pending' ? 'Chờ duyệt' : 'Bị chặn'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteSong(song._id)}
                          className="p-1.5 text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant text-label-sm">Bạn chưa tải lên bài hát nào.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MusicPlayer />
    </>
  );
};

export default UploadManage;
