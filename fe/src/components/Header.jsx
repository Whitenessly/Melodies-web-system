import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

const Header = ({ placeholder = "Tìm kiếm bài hát, nghệ sĩ..." }) => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setUpdating(true);
    setMessage('');
    try {
      await updateProfile(newName.trim());
      setMessage('Cập nhật thông tin thành công!');
      setTimeout(() => setShowSettings(false), 1500);
    } catch (err) {
      console.error(err);
      setMessage('Cập nhật thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <header className="flex justify-between items-center w-full px-gutter-desktop h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/10">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-4 flex-grow max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border-none rounded-full py-2 pl-10 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all outline-none" 
            placeholder={placeholder} 
            type="text" 
          />
        </div>
      </form>

      {/* Account actions & notifications */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notifications-social')}
            className="text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button 
            onClick={() => {
              setNewName(user?.name || '');
              setMessage('');
              setShowSettings(true);
            }}
            className="text-on-surface-variant hover:text-primary transition-colors scale-95 active:scale-90 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="font-label-md text-label-md text-white font-bold">{user.name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{user.role}</p>
            </div>
            <div 
              onClick={() => {
                setNewName(user?.name || '');
                setMessage('');
                setShowSettings(true);
              }}
              className="h-10 w-10 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-primary font-bold cursor-pointer hover:border-primary transition-all"
            >
              {user.name[0].toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal (User Profile update) */}
      {showSettings && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-headline-md text-headline-md text-white mb-6">Cài đặt tài khoản</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Họ và tên</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary transition-all outline-none"
                  placeholder="Nhập tên mới..."
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-1">Email (Không thể thay đổi)</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-body-md text-on-surface-variant/70 cursor-not-allowed outline-none"
                />
              </div>

              {message && (
                <p className={`text-label-sm font-semibold ${message.includes('thành công') ? 'text-secondary' : 'text-error'}`}>
                  {message}
                </p>
              )}

              <button 
                type="submit" 
                disabled={updating}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all cursor-pointer flex justify-center items-center"
              >
                {updating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Header;
