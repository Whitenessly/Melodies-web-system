import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { api } from '../utils/api.js';

export default function UploadManage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState(180);
  
  // Files
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  // Progress & loading
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError('Tệp âm thanh vượt quá giới hạn dung lượng 100MB.');
        return;
      }
      setAudioFile(file);
      setError('');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError('Tệp ảnh bìa vượt quá giới hạn dung lượng 2MB.');
        return;
      }
      setImageFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !audioFile) {
      setError('Vui lòng điền tên bài hát và chọn tệp âm thanh.');
      return;
    }

    setLoading(true);
    setProgress(10);
    setError('');

    try {
      setProgress(30);
      const audioData = await fileToBase64(audioFile);
      
      setProgress(60);
      let imageData = '';
      if (imageFile) {
        imageData = await fileToBase64(imageFile);
      }

      setProgress(80);
      await api.post('/songs', {
        title,
        genre,
        lyrics,
        duration: parseInt(duration) || 180,
        audioData,
        imageData
      });

      setProgress(100);
      setTimeout(() => {
        navigate('/artist-dashboard');
      }, 500);
    } catch (err) {
      setError(err.message || 'Tải lên bài hát thất bại.');
      setLoading(false);
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
              <span className="material-symbols-outlined text-secondary-container">publish</span>
              Tải lên Tác phẩm mới
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Tải nhạc định dạng MP3/WAV dung lượng tối đa 100MB. Hệ thống sẽ tự động phân phối các luồng nén 128kbps/320kbps.
            </p>
          </div>

          {error && (
            <div className="bg-error-container/20 border border-status-error/30 text-status-error px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Metadata Fields (Left 2 cols) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Tên bài hát / Track Title</label>
                <input 
                  type="text"
                  required
                  placeholder="Nhập tên bài hát"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Thể loại / Genre</label>
                  <select 
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:border-white/10 focus:bg-white/10 transition [&>option]:bg-surface [&>option]:text-white"
                  >
                    <option value="Electronic">Electronic</option>
                    <option value="Brutalist">Brutalist</option>
                    <option value="Retro-synth">Retro-synth</option>
                    <option value="V-Pop">V-Pop</option>
                    <option value="Indie">Indie</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Thời lượng (Giây)</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="180"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">Lời bài hát / Lyrics</label>
                <textarea 
                  placeholder="Nhập lời bài hát..."
                  rows="8"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition resize-none"
                />
              </div>

            </div>

            {/* File Drag Zone / Uploading status (Right 1 col) */}
            <div className="flex flex-col gap-6">
              
              {/* Audio Drag Area */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                <span className="material-symbols-outlined text-4xl text-secondary-container">audiotrack</span>
                <div>
                  <p className="text-xs font-bold text-white">Tệp âm thanh (MP3, WAV)</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">Kéo thả hoặc nhấn vào để chọn</p>
                </div>
                <input 
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="hidden"
                  id="audio-upload-input"
                />
                <label 
                  htmlFor="audio-upload-input"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-xl text-[10px] font-bold text-white cursor-pointer select-none"
                >
                  {audioFile ? audioFile.name : 'Chọn File'}
                </label>
              </div>

              {/* Cover Image Drag Area */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                <span className="material-symbols-outlined text-4xl text-secondary-container">image</span>
                <div>
                  <p className="text-xs font-bold text-white">Ảnh bìa bài hát (1:1)</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">Dung lượng tối đa 2MB</p>
                </div>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload-input"
                />
                <label 
                  htmlFor="image-upload-input"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-xl text-[10px] font-bold text-white cursor-pointer select-none"
                >
                  {imageFile ? imageFile.name : 'Chọn File'}
                </label>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl electric-btn text-white font-bold text-sm hover:scale-102 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? 'Đang chuyển đổi & Tải lên...' : 'Xuất bản tác phẩm'}
              </button>

              {/* Progress bar */}
              {loading && (
                <div className="w-full bg-white/5 border border-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary-container to-primary-container transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

            </div>

          </form>

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
