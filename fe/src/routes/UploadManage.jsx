import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

export default function UploadManage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [customGenre, setCustomGenre] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState(180);
  
  // Files and Upload Statuses
  const [audioFile, setAudioFile] = useState(null);
  const [audioStatus, setAudioStatus] = useState('idle'); // idle, uploading, success, error
  const [audioProgress, setAudioProgress] = useState(0);

  const [imageFile, setImageFile] = useState(null);
  const [imageStatus, setImageStatus] = useState('idle'); // idle, uploading, success, error
  const [imageProgress, setImageProgress] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  
  // Submitting status (when they click publish)
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const simulateAudioUpload = (file, isRetry = false) => {
    setAudioFile(file);
    setAudioStatus('uploading');
    setAudioProgress(0);
    setError('');

    // Simulate 20% error rate on first upload attempt
    const shouldFail = !isRetry && Math.random() < 0.2;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        if (shouldFail) {
          setAudioStatus('error');
          setAudioProgress(0);
        } else {
          setAudioStatus('success');
          setAudioProgress(100);
          
          // Get default title from file name (no extension)
          const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setTitle(defaultTitle);

          // Get duration from file
          const objectUrl = URL.createObjectURL(file);
          const audio = new Audio(objectUrl);
          audio.addEventListener('loadedmetadata', () => {
            setDuration(Math.round(audio.duration));
            URL.revokeObjectURL(objectUrl);
          });
        }
      } else {
        setAudioProgress(currentProgress);
      }
    }, 150);
  };

  const simulateImageUpload = (file, isRetry = false) => {
    setImageFile(file);
    setImageStatus('uploading');
    setImageProgress(0);
    setError('');

    // Simulate 20% error rate on first upload attempt
    const shouldFail = !isRetry && Math.random() < 0.2;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        if (shouldFail) {
          setImageStatus('error');
          setImageProgress(0);
        } else {
          setImageStatus('success');
          setImageProgress(100);
          
          const url = URL.createObjectURL(file);
          if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
          }
          setImagePreviewUrl(url);
        }
      } else {
        setImageProgress(currentProgress);
      }
    }, 150);
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError(t('err_audio_large'));
        return;
      }
      simulateAudioUpload(file);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError(t('err_image_large'));
        return;
      }
      simulateImageUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (audioStatus !== 'success') {
      setError(t('err_invalid_audio'));
      return;
    }
    if (!title) {
      setError(t('err_missing_title'));
      return;
    }
    if (genre === 'new_genre' && !customGenre.trim()) {
      setError(t('err_missing_genre'));
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
      if (imageFile && imageStatus === 'success') {
        imageData = await fileToBase64(imageFile);
      }

      setProgress(80);
      await api.post('/songs', {
        title,
        genre: genre === 'new_genre' ? customGenre.trim() : genre,
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
      setError(err.message || t('err_upload_failed'));
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
              {t('upload_new_release_title')}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              {t('upload_release_desc')}
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
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('track_title_label')}</label>
                <input 
                  type="text"
                  required
                  placeholder={t('track_title_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                />
              </div>

              <div className={genre === 'new_genre' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('genre_label')}</label>
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
                    <option value="new_genre">{t('other_genre_option')}</option>
                  </select>
                </div>

                {genre === 'new_genre' && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('custom_genre_label')}</label>
                    <input 
                      type="text"
                      required
                      placeholder={t('custom_genre_placeholder')}
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-on-surface-variant focus:border-white/10 focus:bg-white/10 transition"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant ml-1">{t('lyrics_label')}</label>
                <textarea 
                  placeholder={t('lyrics_placeholder')}
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
              {audioStatus === 'idle' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-secondary-container animate-pulse">audiotrack</span>
                  <div>
                    <p className="text-xs font-bold text-white">{t('audio_file_label')}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{t('drag_drop_select')}</p>
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
                    {t('choose_file_btn')}
                  </label>
                </div>
              )}

              {audioStatus === 'uploading' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-secondary-container animate-spin">sync</span>
                  <div className="w-full px-4">
                    <p className="text-xs font-bold text-white mb-2">{t('uploading_audio')}</p>
                    <div className="w-full bg-white/5 border border-white/5 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary-container to-primary-container transition-all duration-300"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">{audioProgress}%</p>
                  </div>
                </div>
              )}

              {audioStatus === 'success' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px] relative overflow-hidden">
                  <span className="material-symbols-outlined text-4xl text-status-success">check_circle</span>
                  <div>
                    <p className="text-xs font-bold text-status-success">{t('upload_success')}</p>
                    <p className="text-[10px] text-white mt-2 truncate max-w-[200px]" title={audioFile?.name}>
                      🎵 {audioFile?.name}
                    </p>
                    {duration > 0 && (
                      <p className="text-[9px] text-on-surface-variant mt-0.5">
                        {t('track_duration_label')} {Math.floor(duration / 60)}m {duration % 60}s
                      </p>
                    )}
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
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-lg text-[9px] font-bold text-white cursor-pointer select-none"
                  >
                    {t('change_file_btn')}
                  </label>
                </div>
              )}

              {audioStatus === 'error' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-status-error">cancel</span>
                  <div>
                    <p className="text-xs font-bold text-status-error">{t('failed_to_upload')}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{t('please_retry_file')} {audioFile?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => simulateAudioUpload(audioFile, true)}
                      className="px-3 py-1.5 bg-secondary-container hover:bg-secondary-container/80 transition rounded-lg text-[10px] font-bold text-black cursor-pointer"
                    >
                      {t('retry_upload_btn')}
                    </button>
                    <input 
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                      id="audio-upload-input"
                    />
                    <label 
                      htmlFor="audio-upload-input"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-lg text-[10px] font-bold text-white cursor-pointer select-none"
                    >
                      {t('choose_other_file_btn')}
                    </label>
                  </div>
                </div>
              )}

              {/* Cover Image Drag Area */}
              {imageStatus === 'idle' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-secondary-container">image</span>
                  <div>
                    <p className="text-xs font-bold text-white">{t('cover_image_label')}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{t('max_image_size')}</p>
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
                    {t('choose_file_btn')}
                  </label>
                </div>
              )}

              {imageStatus === 'uploading' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-secondary-container animate-spin">sync</span>
                  <div className="w-full px-4">
                    <p className="text-xs font-bold text-white mb-2">{t('uploading_cover')}</p>
                    <div className="w-full bg-white/5 border border-white/5 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary-container to-primary-container transition-all duration-300"
                        style={{ width: `${imageProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">{imageProgress}%</p>
                  </div>
                </div>
              )}

              {imageStatus === 'success' && (
                <div className="glass-panel rounded-3xl border border-white/5 min-h-[220px] relative overflow-hidden group flex items-center justify-center">
                  <img 
                    src={imagePreviewUrl} 
                    alt="Cover Preview" 
                    className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center gap-2">
                    <p className="text-xs font-bold text-white">{t('selected_cover')}</p>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-input"
                    />
                    <label 
                      htmlFor="image-upload-input"
                      className="px-3 py-1.5 bg-secondary-container hover:bg-secondary-container/80 transition rounded-lg text-[10px] font-bold text-black cursor-pointer select-none"
                    >
                      {t('change_cover_btn')}
                    </label>
                  </div>
                </div>
              )}

              {imageStatus === 'error' && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-center items-center justify-center min-h-[220px]">
                  <span className="material-symbols-outlined text-4xl text-status-error">cancel</span>
                  <div>
                    <p className="text-xs font-bold text-status-error">{t('failed_to_upload')}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{t('please_retry_file')} {imageFile?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => simulateImageUpload(imageFile, true)}
                      className="px-3 py-1.5 bg-secondary-container hover:bg-secondary-container/80 transition rounded-lg text-[10px] font-bold text-black cursor-pointer"
                    >
                      {t('retry_upload_btn')}
                    </button>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-input"
                    />
                    <label 
                      htmlFor="image-upload-input"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-lg text-[10px] font-bold text-white cursor-pointer select-none"
                    >
                      {t('choose_other_file_btn')}
                    </label>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={loading || audioStatus !== 'success' || (imageFile && imageStatus !== 'success')}
                className="w-full h-12 rounded-2xl electric-btn text-white font-bold text-sm hover:scale-102 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? t('publishing_loader') : t('publish_release_btn')}
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


