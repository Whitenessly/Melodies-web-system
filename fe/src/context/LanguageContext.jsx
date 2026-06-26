import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    home: 'Home',
    search: 'Search',
    library: 'Library',
    notifications: 'Notifications',
    settings: 'Settings',
    premium: 'Premium Plans',
    lyrics: 'Lyrics',
    queue: 'Queue',
    playing_ad: 'Ad playing. Controls disabled.',
    free_banner: 'Ad-supported session. Upgrade to Premium for 320kbps & download DRM files!',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    artist_dashboard: 'Artist Studio',
    admin_dashboard: 'Admin Control',
    recent_plays: 'Recently Played',
    featured: 'Featured Playlists',
    artists: 'Artists to Follow',
    waveform: 'Waveform Progress',
    search_placeholder: 'Search songs, artists, albums...',
    moderation_queue: 'Moderation Queue',
    ad_campaigns: 'Ad Campaigns',
    subscriptions: 'Subscriptions',
    welcome: 'Welcome back',
    download_drm: 'Download DRM Binary',
    upload_songs: 'Upload Songs',
    profanity_hidden: 'Hidden comments (profanity flagged)'
  },
  vi: {
    home: 'Trang chủ',
    search: 'Tìm kiếm',
    library: 'Thư viện',
    notifications: 'Thông báo',
    settings: 'Cài đặt',
    premium: 'Gói Premium',
    lyrics: 'Lời bài hát',
    queue: 'Hàng đợi',
    playing_ad: 'Quảng cáo đang phát. Đã vô hiệu hóa các nút tua/chuyển bài.',
    free_banner: 'Phiên bản miễn phí có quảng cáo. Nâng cấp Premium để nghe nhạc 320kbps & tải DRM!',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    artist_dashboard: 'Kênh Nghệ sĩ',
    admin_dashboard: 'Kênh Admin',
    recent_plays: 'Nghe gần đây',
    featured: 'Danh sách phát nổi bật',
    artists: 'Nghệ sĩ đề xuất',
    waveform: 'Tiến trình sóng âm',
    search_placeholder: 'Tìm kiếm bài hát, nghệ sĩ, album...',
    moderation_queue: 'Danh sách kiểm duyệt',
    ad_campaigns: 'Quảng cáo & Ads',
    subscriptions: 'Cài đặt gói cước',
    welcome: 'Chào mừng trở lại',
    download_drm: 'Tải file DRM',
    upload_songs: 'Tải lên bài hát',
    profanity_hidden: 'Bình luận bị ẩn (chứa từ nhạy cảm)'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
