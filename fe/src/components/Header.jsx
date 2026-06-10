import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const Header = ({ placeholder, showSearch = true }) => {
  const { user, logout, hasUnread } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const defaultPlaceholder = t("Tìm kiếm bài hát, nghệ sĩ...");
  const currentPlaceholder = placeholder || defaultPlaceholder;
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
              placeholder={currentPlaceholder} 
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
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all scale-95 active:scale-90 cursor-pointer"
            title={t("Thông báo")}
          >
            <span className="material-symbols-outlined">notifications</span>
            {hasUnread && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
            )}
          </button>
        </div>

        {user && (
          <div className="relative">
            {/* User Avatar Clickable */}
            <div 
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowLangSubmenu(false);
              }}
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
                    setShowLangSubmenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  {t("Cài đặt tài khoản")}
                </button>

                <div className="relative">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLangSubmenu(!showLangSubmenu);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">language</span>
                      {t("Ngôn ngữ")}
                    </div>
                    <span className="material-symbols-outlined text-xs">arrow_back_ios</span>
                  </button>
                  
                  {/* Language Submenu to the left */}
                  {showLangSubmenu && (
                    <div className="absolute right-full top-0 mr-2 w-48 rounded-2xl bg-surface-container border border-white/10 shadow-2xl py-2 z-50">
                      <button
                        type="button"
                        onClick={() => {
                          if (language !== 'en') {
                            setLanguage('en');
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>English</span>
                        {language === 'en' && (
                          <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (language !== 'vi') {
                            setLanguage('vi');
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-label-md text-white font-bold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Tiếng Việt</span>
                        {language === 'vi' && (
                          <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowLangSubmenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-error/10 text-label-md text-error font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t("Đăng xuất")}
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
