import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const Sidebar = () => {
  const { user, logout, hasUnread } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  const getLinkClass = (path) => {
    const base = "flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-300 ease-in-out ";
    if (isActive(path)) {
      return base + "text-white border-l-4 border-primary bg-primary/10";
    }
    return base + "text-on-surface-variant hover:bg-white/5 hover:text-white";
  };

  return (
    <aside className="fixed left-6 top-6 bottom-[144px] w-[280px] flex flex-col z-40 bg-surface-container-low/50 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl hidden md:flex overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div className="p-gutter-desktop flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-primary leading-none">Melodies</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">Sonic Ethereal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4 flex-grow space-y-2">
        <Link className={getLinkClass('/home')} to="/home">
          <span className="material-symbols-outlined">home</span>
          <span>{t("Trang chủ")}</span>
        </Link>
        <Link className={getLinkClass('/search-results')} to="/search-results">
          <span className="material-symbols-outlined">search</span>
          <span>{t("Tìm kiếm")}</span>
        </Link>
        <Link className={getLinkClass('/library-playlists')} to="/library-playlists">
          <span className="material-symbols-outlined">library_music</span>
          <span>{t("Thư viện")}</span>
        </Link>

        {/* Artist Analytics & Upload - only for Artists/Admins */}
        {user && (user.role === 'artist' || user.role === 'admin') && (
          <>
            <Link className={getLinkClass('/artist-dashboard')} to="/artist-dashboard">
              <span className="material-symbols-outlined">insights</span>
              <span>{t("Phân tích")}</span>
            </Link>
            <Link className={getLinkClass('/upload-manage')} to="/upload-manage">
              <span className="material-symbols-outlined">cloud_upload</span>
              <span>{t("Quản lý tải nhạc")}</span>
            </Link>
          </>
        )}

        {/* Admin Dashboard - only for Admin */}
        {user && user.role === 'admin' && (
          <Link className={getLinkClass('/admin-dashboard')} to="/admin-dashboard">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>{t("Quản trị")}</span>
          </Link>
        )}

        {/* Social notifications */}
        <Link className={`${getLinkClass('/notifications-social')} relative`} to="/notifications-social">
          <span className="material-symbols-outlined">notifications</span>
          <span>{t("Thông báo")}</span>
          {hasUnread && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
          )}
        </Link>

        {/* Subscription Plans */}
        <Link className={getLinkClass('/subscription-plans')} to="/subscription-plans">
          <span className="material-symbols-outlined">card_membership</span>
          <span>{t("Gói nâng cấp")}</span>
        </Link>

        {/* Settings */}
        <Link className={getLinkClass('/settings')} to="/settings">
          <span className="material-symbols-outlined">settings</span>
          <span>{t("Cài đặt")}</span>
        </Link>
      </nav>

      {/* Upload Button */}
      {user && (user.role === 'artist' || user.role === 'admin') && (
        <div className="px-6 mb-4">
          <button 
            onClick={() => navigate('/upload-manage')}
            className="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform shadow-xl cursor-pointer"
          >
            {t("Tải nhạc lên")}
          </button>
        </div>
      )}

      {/* Footer / Account */}
      <footer className="p-4 border-t border-white/5 space-y-1">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2 mb-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  user.name[0].toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-label-md text-label-md text-white truncate">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-2 w-full text-left rounded-lg text-error hover:bg-error/10 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md">{t("Đăng xuất")}</span>
            </button>
          </>
        ) : (
          <Link 
            className="flex items-center gap-4 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-all"
            to="/auth"
          >
            <span className="material-symbols-outlined">login</span>
            <span className="font-label-md text-label-md">{t("Đăng nhập")}</span>
          </Link>
        )}
      </footer>
    </aside>
  );
};

export default Sidebar;
