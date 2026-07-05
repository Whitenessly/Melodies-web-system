import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../utils/api.js';

function AdminAudioPlayer({ src }) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative flex items-center bg-white/5 hover:bg-white/10 transition border border-white/10 text-white h-9 px-4 rounded-full gap-3 shadow-lg select-none font-medium">
      <audio 
        ref={audioRef} 
        src={src} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {/* Play/Pause Button */}
      <button 
        type="button" 
        onClick={togglePlay}
        className="material-symbols-outlined text-xl hover:scale-110 transition cursor-pointer text-secondary-container flex items-center justify-center"
      >
        {isPlaying ? 'pause' : 'play_arrow'}
      </button>

      {/* Time Display */}
      <span className="text-[11px] font-mono whitespace-nowrap text-white/80">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Separator */}
      <div className="w-[1px] h-4 bg-white/10" />

      {/* Volume Control */}
      <div 
        className="relative flex items-center justify-center h-full"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button 
          type="button"
          onClick={() => {
            const newVol = volume === 0 ? 1 : 0;
            setVolume(newVol);
            if (audioRef.current) audioRef.current.volume = newVol;
          }}
          className="material-symbols-outlined text-lg hover:scale-105 transition cursor-pointer text-white/80 hover:text-white flex items-center justify-center"
        >
          {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
        </button>

        {/* Upward popping volume slider */}
        {showVolumeSlider && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 z-50 flex flex-col items-center animate-fadeIn">
            <div className="bg-surface/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center gap-2">
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="h-20 w-1.5 accent-secondary-container bg-white/10 rounded-full cursor-pointer"
                style={{ WebkitAppearance: 'slider-vertical' }}
              />
              <span className="text-[9px] font-mono font-bold text-secondary-container">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'songs', 'comments', 'ads', 'config'
  
  // States
  const [stats, setStats] = useState(null);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [hiddenComments, setHiddenComments] = useState([]);
  const [ads, setAds] = useState([]);
  const [plans, setPlans] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adType, setAdType] = useState('audio'); // audio, banner
  const [adClient, setAdClient] = useState('');
  const [adBudget, setAdBudget] = useState(100);
  const [adAudioUrl, setAdAudioUrl] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adLocation, setAdLocation] = useState('stream_break'); // stream_break, sidebar

  // Payment sandbox credentials
  const [momoMerchant, setMomoMerchant] = useState('');
  const [momoSecret, setMomoSecret] = useState('');
  const [vnpayMerchant, setVnpayMerchant] = useState('');
  const [vnpaySecret, setVnpaySecret] = useState('');
  const [stripePublishable, setStripePublishable] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [planPrices, setPlanPrices] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const statsData = await api.get('/admin/stats');
        setStats(statsData);
      } else if (activeTab === 'songs') {
        const songsData = await api.get('/admin/moderation/songs');
        setPendingSongs(songsData);
      } else if (activeTab === 'comments') {
        const commentsData = await api.get('/admin/moderation/comments');
        setHiddenComments(commentsData);
      } else if (activeTab === 'ads') {
        const adsData = await api.get('/admin/ads');
        setAds(adsData);
      } else if (activeTab === 'config') {
        const plansData = await api.get('/admin/plans');
        setPlans(plansData);
        
        const priceMap = {};
        plansData.forEach(p => {
          priceMap[p.planId] = p.price;
        });
        setPlanPrices(priceMap);
        
        // Fetch payment configs
        const momoConfig = await api.get('/admin/payment-config/momo');
        if (momoConfig) {
          setMomoMerchant(momoConfig.merchantId || '');
          setMomoSecret(momoConfig.secretKey || '');
        }
        const vnpayConfig = await api.get('/admin/payment-config/vnpay');
        if (vnpayConfig) {
          setVnpayMerchant(vnpayConfig.merchantId || '');
          setVnpaySecret(vnpayConfig.secretKey || '');
        }
        const stripeConfig = await api.get('/admin/payment-config/stripe');
        if (stripeConfig) {
          setStripePublishable(stripeConfig.publishableKey || '');
          setStripeSecret(stripeConfig.secretKey || '');
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Songs Moderation
  const handleApproveSong = async (songId) => {
    try {
      await api.post(`/admin/moderation/songs/${songId}/approve`);
      setPendingSongs(prev => prev.filter(s => s._id !== songId));
      alert(t('msg_song_approved'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBanSong = async (songId) => {
    try {
      await api.post(`/admin/moderation/songs/${songId}/ban`);
      setPendingSongs(prev => prev.filter(s => s._id !== songId));
      alert(t('msg_song_banned'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Comments Moderation
  const handleApproveComment = async (commentId) => {
    try {
      await api.post(`/admin/moderation/comments/${commentId}/approve`);
      setHiddenComments(prev => prev.filter(c => c._id !== commentId));
      alert(t('msg_comment_approved'));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectComment = async (commentId) => {
    try {
      await api.delete(`/admin/moderation/comments/${commentId}`);
      setHiddenComments(prev => prev.filter(c => c._id !== commentId));
      alert(t('msg_comment_deleted'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Ad CRUD
  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      const newAd = await api.post('/admin/ads', {
        title: adTitle,
        type: adType,
        clientName: adClient,
        budgetLimit: adBudget,
        audioUrl: adAudioUrl,
        imageUrl: adImageUrl,
        targetUrl: adTargetUrl,
        location: adLocation
      });
      setAds(prev => [...prev, newAd]);
      setShowAdModal(false);
      
      // Clear form
      setAdTitle('');
      setAdClient('');
      setAdBudget(100);
      setAdAudioUrl('');
      setAdImageUrl('');
      setAdTargetUrl('');
    } catch (err) {
      alert(t('err_upload_failed') + ': ' + err.message);
    }
  };

  const handleToggleAdStatus = async (ad) => {
    const nextStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await api.put(`/admin/ads/${ad._id}`, { status: nextStatus });
      setAds(prev => prev.map(item => item._id === ad._id ? updated : item));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm(t('confirm_delete_ad'))) return;
    try {
      await api.delete(`/admin/ads/${adId}`);
      setAds(prev => prev.filter(item => item._id !== adId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Pricing Config
  const handleSavePrices = async () => {
    try {
      for (const plan of plans) {
        const newPrice = planPrices[plan.planId];
        if (newPrice !== undefined && newPrice !== plan.price) {
          await api.put(`/admin/plans/${plan._id}`, { price: newPrice });
        }
      }
      alert('Đã cập nhật biểu phí gói dịch vụ thành công!');
      // Reload plans to refresh state
      const plansData = await api.get('/admin/plans');
      setPlans(plansData);
    } catch (err) {
      alert('Cập nhật biểu phí thất bại: ' + err.message);
    }
  };

  const handleSavePaymentConfig = async (gateway, secretKey, merchantId, publishableKey = '') => {
    try {
      await api.post('/admin/payment-config', { gateway, secretKey, merchantId, publishableKey });
      alert(`Đã cập nhật thành công cấu hình cổng thanh toán ${gateway.toUpperCase()}!`);
    } catch (err) {
      alert(err.message);
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
              <span className="material-symbols-outlined text-secondary-container">admin_panel_settings</span>
              {t('admin_dashboard_title')}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              {t('admin_dashboard_subtitle')}
            </p>
          </div>

          {/* Navigation Tabbed items */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
            {[
              { id: 'overview', key: 'tab_overview', icon: 'monitoring' },
              { id: 'songs', key: 'tab_songs', icon: 'rate_review' },
              { id: 'comments', key: 'tab_comments', icon: 'speaker_notes_off' },
              { id: 'ads', key: 'tab_ads', icon: 'campaign' },
              { id: 'config', key: 'tab_config', icon: 'settings_suggest' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  activeTab === tab.id ? 'bg-white/10 text-white shadow' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {t(tab.key)}
              </button>
            ))}
          </div>

          {/* Loading segment */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <p className="text-sm font-semibold">{t('loading_dashboard_modules')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* TAB 1: Overview */}
              {activeTab === 'overview' && stats && (
                <div className="flex flex-col gap-8">
                  {/* Stats card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-panel p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{t('stats_users')}</p>
                      <p className="text-2xl font-extrabold text-white mt-1.5">{stats.metrics?.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{t('stats_premium')}</p>
                      <p className="text-2xl font-extrabold text-tertiary mt-1.5">{stats.metrics?.premiumUsers.toLocaleString()}</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{t('stats_streams')}</p>
                      <p className="text-2xl font-extrabold text-white mt-1.5">{stats.metrics?.totalStreams.toLocaleString()}</p>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{t('stats_revenue')}</p>
                      <p className="text-2xl font-extrabold text-white mt-1.5">{stats.metrics?.monthlyRevenue.toLocaleString()} VND</p>
                    </div>
                  </div>

                  {/* Chart representation */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('chart_title')}</h3>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{t('chart_subtitle')}</p>
                    </div>
                    <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-white/5">
                      {stats.chartData?.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <div 
                            className="w-full rounded-t bg-secondary-container/50 group-hover:bg-secondary-container transition-all"
                            style={{ height: `${item.streams / 3}px` }}
                          />
                          <span className="text-[9px] font-bold text-on-surface-variant">{item.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Song Moderation Queue */}
              {activeTab === 'songs' && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white">{t('song_requests_title')} ({pendingSongs.length})</h3>
                  {pendingSongs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {pendingSongs.map(song => (
                        <div key={song._id} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <img src={song.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div>
                              <p className="text-sm font-bold text-white">{song.title}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{t('song_artist_prefix')} {song.artist} ({song.artistId?.email})</p>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/55 mt-1 bg-white/5 px-2 py-0.5 rounded w-max">{song.genre}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <AdminAudioPlayer src={song.audioUrl} />
                            <button 
                              onClick={() => handleApproveSong(song._id)}
                              className="px-4 py-2 bg-status-success/15 hover:bg-status-success/25 transition text-status-success font-bold text-xs rounded-xl cursor-pointer"
                            >
                              {t('approve_btn')}
                            </button>
                            <button 
                              onClick={() => handleBanSong(song._id)}
                              className="px-4 py-2 bg-status-error/15 hover:bg-status-error/25 transition text-status-error font-bold text-xs rounded-xl cursor-pointer"
                            >
                              {t('reject_btn')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                      <p className="text-xs text-on-surface-variant">{t('no_songs_in_queue')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Comments Hidden Queue */}
              {activeTab === 'comments' && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white">{t('hidden_comments_title')} ({hiddenComments.length})</h3>
                  {hiddenComments.length > 0 ? (
                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                            <th className="p-4">{t('table_user')}</th>
                            <th className="p-4">{t('table_song')}</th>
                            <th className="p-4">{t('table_comment_content')}</th>
                            <th className="p-4 text-center">{t('table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {hiddenComments.map(comment => (
                            <tr key={comment._id} className="hover:bg-white/[0.01]">
                              <td className="p-4 font-bold text-white">{comment.userId?.name}</td>
                              <td className="p-4 text-on-surface-variant">{comment.songId?.title}</td>
                              <td className="p-4 text-status-error italic font-medium">"{comment.content}"</td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleApproveComment(comment._id)}
                                  className="px-3 py-1.5 bg-status-success/15 hover:bg-status-success/25 transition text-status-success rounded-lg font-bold"
                                >
                                  {t('show_comment_btn')}
                                </button>
                                <button 
                                  onClick={() => handleRejectComment(comment._id)}
                                  className="px-3 py-1.5 bg-status-error/15 hover:bg-status-error/25 transition text-status-error rounded-lg font-bold"
                                >
                                  {t('delete_comment_btn')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                      <p className="text-xs text-on-surface-variant">{t('no_flagged_comments')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Ads Campaigns */}
              {activeTab === 'ads' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">{t('ads_campaigns_title')}</h3>
                    <button 
                      onClick={() => setShowAdModal(true)}
                      className="electric-btn text-white text-xs font-bold px-4 py-2 rounded-xl hover:scale-102 transition cursor-pointer shadow-lg"
                    >
                      {t('create_new_ad_btn')}
                    </button>
                  </div>

                  {ads.length > 0 ? (
                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                            <th className="p-4">{t('table_ad_name')}</th>
                            <th className="p-4">{t('table_ad_type')}</th>
                            <th className="p-4">{t('table_ad_client')}</th>
                            <th className="p-4 text-center">{t('table_ad_impressions')}</th>
                            <th className="p-4 text-center">{t('table_ad_clicks')}</th>
                            <th className="p-4 text-center">{t('table_ad_budget')}</th>
                            <th className="p-4 text-center">{t('status')}</th>
                            <th className="p-4 text-center">{t('table_actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {ads.map(ad => (
                            <tr key={ad._id} className="hover:bg-white/[0.01]">
                              <td className="p-4 font-bold text-white">{ad.title}</td>
                              <td className="p-4 text-on-surface-variant capitalize">{ad.type}</td>
                              <td className="p-4 text-on-surface-variant">{ad.clientName}</td>
                              <td className="p-4 text-center font-mono">{ad.impressions || 0}</td>
                              <td className="p-4 text-center font-mono">{ad.clicks || 0}</td>
                              <td className="p-4 text-center font-mono text-tertiary">
                                {ad.budgetSpent?.toLocaleString()} / {ad.budgetLimit?.toLocaleString()} USD
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  ad.status === 'active' ? 'bg-status-success/15 text-status-success' : 'bg-white/10 text-on-surface-variant'
                                }`}>
                                  {ad.status}
                                </span>
                              </td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleToggleAdStatus(ad)}
                                  className="text-[10px] font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 transition"
                                >
                                  {ad.status === 'active' ? t('action_stop') : t('action_start')}
                                </button>
                                <button 
                                  onClick={() => handleDeleteAd(ad._id)}
                                  className="text-[10px] font-bold px-2 py-1 bg-status-error/15 hover:bg-status-error/25 text-status-error rounded transition"
                                >
                                  {t('delete_comment_btn')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                      <p className="text-xs text-on-surface-variant">{t('no_ads_setup')}</p>
                    </div>
                  )}

                  {/* Create Ad modal dialog overlay */}
                  {showAdModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                      <form onSubmit={handleCreateAd} className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-4">
                        <h2 className="text-base font-bold text-white">{t('create_ad_modal_title')}</h2>
                        
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_title')}</label>
                           <input type="text" required placeholder="Campaign Name" value={adTitle} onChange={e => setAdTitle(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_type')}</label>
                            <select value={adType} onChange={e => setAdType(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white [&>option]:bg-surface">
                              <option value="audio">{t('option_ad_audio')}</option>
                              <option value="banner">{t('option_ad_banner')}</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_budget')}</label>
                            <input type="number" min="1" value={adBudget} onChange={e => setAdBudget(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_client')}</label>
                          <input type="text" required placeholder="Client name" value={adClient} onChange={e => setAdClient(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                        </div>

                        {adType === 'audio' ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_audio_url')}</label>
                            <input type="text" placeholder="https://example.com/ad.mp3" value={adAudioUrl} onChange={e => setAdAudioUrl(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_image_url')}</label>
                            <input type="text" placeholder="https://example.com/ad.png" value={adImageUrl} onChange={e => setAdImageUrl(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('label_ad_target_url')}</label>
                          <input type="text" placeholder="https://target-business.com" value={adTargetUrl} onChange={e => setAdTargetUrl(e.target.value)} className="w-full h-10 px-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white" />
                        </div>

                        <div className="flex gap-3 justify-end mt-2">
                          <button type="button" onClick={() => setShowAdModal(false)} className="px-4 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 transition text-white">{t('btn_cancel')}</button>
                          <button type="submit" className="px-4 py-2 rounded-xl text-xs electric-btn text-white font-bold">{t('btn_activate')}</button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 5: Config & Service packages */}
              {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Pricing Plans Config */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-white">{t('plan_config_title')}</h3>
                    <p className="text-[10px] text-on-surface-variant">{t('plan_config_subtitle')}</p>
                    
                    <div className="flex flex-col gap-4 mt-2">
                      {plans.map(plan => (
                        <div key={plan._id} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                          <div>
                            <p className="text-xs font-bold text-white capitalize">{plan.name} Plan</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">{plan.planId}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              value={planPrices[plan.planId] !== undefined ? planPrices[plan.planId] : plan.price}
                              onChange={(e) => setPlanPrices(prev => ({ ...prev, [plan.planId]: parseInt(e.target.value) || 0 }))}
                              className="w-24 h-9 px-2 text-right bg-background border border-white/5 rounded-lg text-xs font-mono font-bold"
                            />
                            <span className="text-[10px] text-on-surface-variant">VND</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSavePrices}
                      className="text-[10px] font-bold px-4 py-2 bg-secondary-container text-black rounded-xl hover:bg-secondary-container/90 transition cursor-pointer self-end mt-2"
                    >
                      Lưu biểu phí gói
                    </button>
                  </div>

                  {/* Payment Sandbox API configurations */}
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">{t('sandbox_payment_title')}</h3>
                      <p className="text-[10px] text-on-surface-variant">{t('sandbox_payment_subtitle')}</p>
                    </div>

                    {/* Momo config */}
                    <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <h4 className="text-xs font-bold text-[#A50064] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                        Momo Merchant Credentials
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Merchant ID</label>
                          <input type="text" value={momoMerchant} onChange={e => setMomoMerchant(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Secret Key</label>
                          <input type="password" value={momoSecret} onChange={e => setMomoSecret(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSavePaymentConfig('momo', momoSecret, momoMerchant)}
                        className="text-[9px] font-bold px-3 py-1.5 bg-[#A50064]/20 text-[#A50064] rounded-lg mt-2 w-max hover:bg-[#A50064]/30 transition cursor-pointer"
                      >
                        {t('btn_update_momo')}
                      </button>
                    </div>

                    {/* VNPay config */}
                    <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <h4 className="text-xs font-bold text-[#005BAA] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                        VNPay Merchant Credentials
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Merchant ID</label>
                          <input type="text" value={vnpayMerchant} onChange={e => setVnpayMerchant(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Secret Key</label>
                          <input type="password" value={vnpaySecret} onChange={e => setVnpaySecret(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSavePaymentConfig('vnpay', vnpaySecret, vnpayMerchant)}
                        className="text-[9px] font-bold px-3 py-1.5 bg-[#005BAA]/20 text-[#005BAA] rounded-lg mt-2 w-max hover:bg-[#005BAA]/30 transition cursor-pointer"
                      >
                        {t('btn_update_vnpay')}
                      </button>
                    </div>

                    {/* Stripe config */}
                    <div className="flex flex-col gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">credit_card</span>
                        Stripe Credit Card Credentials
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Publishable Key</label>
                          <input type="text" value={stripePublishable} onChange={e => setStripePublishable(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-on-surface-variant">Secret Key</label>
                          <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="h-9 px-3 bg-background border border-white/5 rounded-lg text-[10px] text-white" />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSavePaymentConfig('stripe', stripeSecret, '', stripePublishable)}
                        className="text-[9px] font-bold px-3 py-1.5 bg-primary/20 text-primary rounded-lg mt-2 w-max hover:bg-primary/30 transition cursor-pointer"
                      >
                        Cập nhật Stripe Config
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
