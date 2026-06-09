import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

const Header = ({ placeholder = "Tìm kiếm bài hát, nghệ sĩ...", showSearch = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`;
    }
    return null;
  };

  return (
    <header className="flex justify-between items-center w-full px-gutter-desktop h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/10">
      {/* Search Input Bar */}
      {showSearch ? (
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
      ) : (
        <div className="flex-grow"></div>
      )}

      {/* Account actions & notifications */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notifications-social')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all scale-95 active:scale-90 cursor-pointer"
            title="Thông báo"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>

        {user && (
          <div className="relative">
            {/* User Avatar Clickable */}
            <div 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="h-10 w-10 rounded-full overflow-hidden bg-surface-container-high border border-white/10 flex items-center justify-center text-primary font-bold cursor-pointer hover:border-primary active:scale-95 transition-all"
            >
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user.name ? user.name[0].toUpperCase() : 'U'
              )}
            </div>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-container border border-white/10 shadow-2xl py-2 z-40">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-on-surface font-semibold font-bold text-label-md truncate">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{user.role}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Cài đặt tài khoản
                </button>
                
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-error/10 text-label-md text-error font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
