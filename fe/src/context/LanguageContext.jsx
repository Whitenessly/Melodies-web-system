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
    profanity_hidden: 'Hidden comments (profanity flagged)',
    
    // Home Page
    loading_homepage: 'Loading homepage...',
    explore_categories: 'Explore Genres',
    recommended_songs: 'Recommended Songs',
    artists_recommendation: 'Recommended Artists',
    followers: 'followers',
    
    // Search Results / Details
    no_exact_results_fuzzy: 'No exact matches found. Here are some suggestions:',
    found: 'Found',
    matching_songs_count: 'matching songs.',
    searching: 'Searching...',
    did_you_mean: 'Did you mean / Top recommendations:',
    related_artists: 'Related Artists',
    no_matching_results: 'No matching results found',
    try_other_keywords: 'Try searching with other keywords or genres.',
    suggested_query_prefix: 'No exact results for',
    suggested_query_prompt: 'Did you mean:',
    showing_results_for: 'Showing results for',
    
    // Library
    music_library: 'Music Library',
    library_subtitle: 'Keep your personal playlists and favorite songs in one place.',
    create_playlist: 'Create New Playlist',
    liked_songs: 'Liked Songs',
    liked_songs_desc: 'Your collection of top favorite tracks.',
    songs_count: 'songs',
    songs: 'songs',
    no_description: 'No description',
    playlist_name: 'Playlist Name',
    short_description: 'Short Description',
    playlist_desc_placeholder: 'Describe your playlist...',
    privacy: 'Privacy',
    public: 'Public',
    private: 'Private',
    cancel: 'Cancel',
    create: 'Create',
    
    // Playlist Detail
    liked_songs_playlist_desc: 'Collection of all tracks you liked.',
    playlist_not_found: 'Playlist not found.',
    songs_list: 'Songs List',
    remove_track: 'Remove Track',
    no_songs_in_playlist: 'No songs in this playlist.',
    
    // Artist Detail
    artist_not_found: 'Artist profile not found.',
    all_songs: 'All Releases',
    no_songs_by_artist: 'This artist has not uploaded any songs yet.',
    
    // Settings
    account_settings: 'Account Settings',
    settings_subtitle: 'Update your profile information and manage premium subscriptions.',
    profile_updated: 'Profile updated successfully!',
    email_disabled: 'Email (Cannot be changed)',
    fullname: 'Full Name',
    avatar_url: 'Avatar URL',
    avatar_url_placeholder: 'Enter image URL path...',
    purchase_transactions: 'Purchase Transactions',
    view_payment_history: 'View Payment History',
    save_changes: 'Save Changes',
    
    // Subscription Plans
    upgrade_premium: 'Upgrade Your Premium Plan',
    subscription_subtitle: 'Unlock superior audio quality. Choose your plan to support artists.',
    choose_gateway: 'Choose Payment Gateway',
    momo_wallet: 'MoMo Wallet',
    vnpay_gateway: 'VNPAY Gateway',
    loading_plans: 'Loading subscription plans...',
    popular: 'Popular',
    vnd_per_month: 'VND / Month',
    default_plan: 'Default',
    upgrade_now: 'Upgrade Now',
    already_free: 'Your account is already on the default Free plan.',
    payment_failed: 'Payment request failed: ',
    
    // Seeded Plan content translations
    'Trải nghiệm nghe nhạc trực tuyến miễn phí': 'Experience free streaming music online',
    'Nghe nhạc cơ bản': 'Basic music listening',
    'Có chèn Audio Ads quảng cáo': 'With Audio Ads inserted',
    'Chất lượng tiêu chuẩn 128kbps': 'Standard 128kbps quality',
    'Tải DRM bị khóa': 'DRM downloads locked',
    'Mở khóa âm nhạc chất lượng cao đỉnh cao': 'Unlock high quality premium audio',
    'Không quảng cáo (Ad-free)': 'Ad-free',
    'Tải nhạc bản quyền DRM Offline': 'Download DRM Offline music',
    'Chất lượng cao 320kbps': 'High quality 320kbps',
    'Âm thanh không nén lossless': 'Lossless audio streaming',
    
    // Forgot Password
    forgot_password: 'Forgot Password',
    forgot_password_desc: 'Enter your email address to receive a recovery code.',
    send_recovery_code: 'Send Recovery Code',
    back_to_login: 'Back to Log In',
    verify_otp_title: 'Verify OTP',
    verify_otp_desc: 'Enter the 6-digit OTP code sent to your email.',
    verify_code_btn: 'Verify Code',
    reset_password_title: 'Reset Password',
    reset_password_desc: 'Enter a new password for your account.',
    set_new_password_btn: 'Reset Password'
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
    profanity_hidden: 'Bình luận bị ẩn (chứa từ nhạy cảm)',
    
    // Home Page
    loading_homepage: 'Tải trang chủ...',
    explore_categories: 'Khám phá Thể loại',
    recommended_songs: 'Bài hát đề xuất',
    artists_recommendation: 'Gợi ý Nghệ sĩ',
    followers: 'người theo dõi',
    
    // Search Results / Details
    no_exact_results_fuzzy: 'Không tìm thấy kết quả phù hợp chính xác. Dưới đây là các gợi ý dành cho bạn:',
    found: 'Tìm thấy',
    matching_songs_count: 'bài hát phù hợp.',
    searching: 'Đang tìm kiếm...',
    did_you_mean: 'Ý bạn là / Đề xuất hàng đầu:',
    related_artists: 'Nghệ sĩ liên quan',
    no_matching_results: 'Không tìm thấy kết quả nào phù hợp',
    try_other_keywords: 'Hãy thử tìm kiếm với các từ khóa hoặc thể loại khác.',
    suggested_query_prefix: 'Không tìm thấy kết quả chính xác cho',
    suggested_query_prompt: 'Có phải bạn muốn tìm:',
    showing_results_for: 'Hiển thị kết quả cho',
    
    // Library
    music_library: 'Thư viện Âm nhạc',
    library_subtitle: 'Nơi lưu giữ các danh sách phát cá nhân của bạn và danh sách các bài hát yêu thích.',
    create_playlist: 'Tạo Playlist mới',
    liked_songs: 'Bài hát Đã thích',
    liked_songs_desc: 'Danh sách lưu trữ các bài hát tâm đắc nhất của bạn.',
    songs_count: 'Bài hát',
    songs: 'bài hát',
    no_description: 'Không có mô tả',
    playlist_name: 'Tên Playlist',
    short_description: 'Mô tả ngắn',
    playlist_desc_placeholder: 'Mô tả danh sách phát của bạn...',
    privacy: 'Quyền riêng tư',
    public: 'Công khai / Public',
    private: 'Riêng tư / Private',
    cancel: 'Hủy',
    create: 'Tạo mới',
    
    // Playlist Detail
    liked_songs_playlist_desc: 'Tuyển tập tất cả các tác phẩm bạn đã bấm yêu thích.',
    playlist_not_found: 'Không tìm thấy danh sách phát.',
    songs_list: 'Danh sách bài hát',
    remove_track: 'Xóa bài',
    no_songs_in_playlist: 'Không có bài hát nào trong playlist này.',
    
    // Artist Detail
    artist_not_found: 'Không tìm thấy thông tin Nghệ sĩ.',
    all_songs: 'Tất cả sản phẩm',
    no_songs_by_artist: 'Nghệ sĩ này chưa đăng tải tác phẩm nào.',
    
    // Settings
    account_settings: 'Thiết lập Tài khoản',
    settings_subtitle: 'Cập nhật thông tin định danh và quản lý các giao dịch nâng cấp Premium.',
    profile_updated: 'Thông tin tài khoản đã được cập nhật thành công!',
    email_disabled: 'Email (Không thể thay đổi)',
    fullname: 'Họ và Tên',
    avatar_url: 'Ảnh đại diện (URL)',
    avatar_url_placeholder: 'Nhập đường dẫn URL hình ảnh...',
    purchase_transactions: 'Giao dịch mua hàng',
    view_payment_history: 'Xem Lịch sử Giao dịch',
    save_changes: 'Lưu thay đổi',
    
    // Subscription Plans
    upgrade_premium: 'Nâng cấp Gói Premium của bạn',
    subscription_subtitle: 'Tự hào nâng tầm chất lượng âm nhạc vượt trội. Lựa chọn gói cước phù hợp và hỗ trợ các nghệ sĩ bạn yêu quý.',
    choose_gateway: 'Chọn cổng kết nối thanh toán',
    momo_wallet: 'Ví MoMo',
    vnpay_gateway: 'Cổng VNPAY',
    loading_plans: 'Tải danh sách các gói cước...',
    popular: 'Popular',
    vnd_per_month: 'VND / Tháng',
    default_plan: 'Mặc định',
    upgrade_now: 'Nâng cấp ngay',
    already_free: 'Tài khoản của bạn đã ở gói Miễn phí mặc định.',
    payment_failed: 'Tạo yêu cầu thanh toán thất bại: ',
    
    // Forgot Password
    forgot_password: 'Quên mật khẩu',
    forgot_password_desc: 'Nhập địa chỉ email của bạn để nhận mã khôi phục.',
    send_recovery_code: 'Gửi mã khôi phục',
    back_to_login: 'Quay lại Đăng nhập',
    verify_otp_title: 'Xác thực OTP',
    verify_otp_desc: 'Nhập mã OTP 6 chữ số đã được gửi đến email của bạn.',
    verify_code_btn: 'Xác thực mã',
    reset_password_title: 'Đặt lại mật khẩu',
    reset_password_desc: 'Nhập mật khẩu mới cho tài khoản của bạn.',
    set_new_password_btn: 'Đặt lại mật khẩu'
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
