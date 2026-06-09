import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import { createPortal } from 'react-dom';

const Settings = () => {
  const { user, setUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [infoMessage, setInfoMessage] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Payment states
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardIsDefault, setCardIsDefault] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  const [cardLoading, setCardLoading] = useState(false);

  // Danger states
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`;
    }
    return null;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateProfile({ avatar: reader.result });
      } catch (err) {
        console.error(err);
        alert('Cập nhật ảnh đại diện thất bại.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) return;
    if (!window.confirm('Bạn có chắc chắn muốn gỡ ảnh đại diện không?')) return;
    try {
      await updateProfile({ removeAvatar: true });
    } catch (err) {
      console.error(err);
      alert('Gỡ ảnh đại diện thất bại.');
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setInfoMessage('Họ và tên không được để trống.');
      return;
    }
    setInfoLoading(true);
    setInfoMessage('');
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      setInfoMessage('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error(err);
      setInfoMessage(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMessage('Mật khẩu hiện tại và mật khẩu mới là bắt buộc.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Mật khẩu mới phải tối thiểu 8 ký tự.');
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordMessage('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMessage(err.message || 'Thay đổi mật khẩu thất bại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (!/^\d{15,16}$/.test(cleanNumber)) {
      setCardMessage('Số thẻ phải chứa 15 hoặc 16 chữ số.');
      return;
    }
    if (!cardholderName.trim()) {
      setCardMessage('Vui lòng nhập tên chủ thẻ.');
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvv)) {
      setCardMessage('Mã CVV phải chứa 3 hoặc 4 chữ số.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(cardExpiry)) {
      setCardMessage('Hạn sử dụng phải có định dạng MM/YYYY (Ví dụ: 12/2026).');
      return;
    }
    setCardLoading(true);
    setCardMessage('');
    try {
      const res = await api.post('/auth/payment-methods', {
        cardNumber: cleanNumber,
        cardholderName: cardholderName.trim(),
        cvv: cardCvv,
        expiry: cardExpiry,
        isDefault: cardIsDefault
      });
      setUser(res.user);
      setShowAddCard(false);
      setCardNumber('');
      setCardholderName('');
      setCardCvv('');
      setCardExpiry('');
      setCardIsDefault(false);
    } catch (err) {
      console.error(err);
      setCardMessage(err.message || 'Thêm thẻ thất bại.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      const res = await api.put(`/auth/payment-methods/${cardId}/default`);
      setUser(res.user);
    } catch (err) {
      console.error(err);
      alert('Đặt thẻ mặc định thất bại.');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phương thức thanh toán này không?')) return;
    try {
      const res = await api.delete(`/auth/payment-methods/${cardId}`);
      setUser(res.user);
    } catch (err) {
      console.error(err);
      alert('Xóa thẻ thất bại.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/profile');
      logout();
      navigate('/auth');
    } catch (err) {
      console.error(err);
      alert('Xóa tài khoản thất bại.');
    } finally {
      setShowDeleteAccountConfirm(false);
    }
  };

  return (
    <>
      <Sidebar />

      <main className="md:ml-sidebar-width pb-[120px] bg-background min-h-screen relative overflow-y-auto">
        <Header showSearch={false} />

        {/* Content Wrapper */}
        <div className="max-w-5xl mx-auto px-margin-page py-12 space-y-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="font-headline-xl text-headline-xl font-bold text-white leading-tight">Cài đặt tài khoản</h2>
          </div>

          {/* Profile Card Section */}
          <section className="flex flex-col md:flex-row gap-10 items-center p-8 rounded-3xl glass-panel relative overflow-hidden group">
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-4 border-primary/20 p-1 relative z-10 overflow-hidden bg-surface-container">
                {getAvatarUrl() ? (
                  <img 
                    src={getAvatarUrl()} 
                    alt={user?.name} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-primary font-bold text-5xl">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              {/* File Input for Avatar */}
              <label className="absolute bottom-2 right-2 bg-primary text-on-primary-container p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-20 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="text-center md:text-left z-10 space-y-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface leading-tight font-bold">{user?.name}</h3>
              <p className="text-on-surface-variant font-body-md pb-4">{user?.email}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <label className="px-6 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full font-label-md hover:bg-primary/20 transition-all cursor-pointer">
                  Đổi ảnh đại diện
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                  />
                </label>
                <button 
                  onClick={handleRemoveAvatar}
                  disabled={!user?.avatarUrl}
                  className="px-6 py-2 bg-surface-variant/50 text-on-surface-variant rounded-full font-label-md hover:bg-surface-variant transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Gỡ ảnh
                </button>
              </div>
            </div>
          </section>

          {/* Account Details & Password Forms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Account Info details */}
            <div className="space-y-6">
              <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-secondary">person_edit</span>
                Thông tin tài khoản
              </h4>
              <div className="glass-panel p-8 rounded-3xl space-y-6">
                <form onSubmit={handleUpdateInfo} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-on-surface-variant font-label-sm ml-1">Họ và tên</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
                      placeholder="Nguyễn Văn Felix"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-on-surface-variant font-label-sm ml-1">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
                      placeholder="felix.nguyen@melodies.vn"
                      required
                    />
                  </div>

                  {infoMessage && (
                    <p className={`text-label-sm font-semibold ml-1 ${infoMessage.includes('thành công') ? 'text-secondary' : 'text-error'}`}>
                      {infoMessage}
                    </p>
                  )}

                  <button 
                    type="submit"
                    disabled={infoLoading}
                    className="w-full py-3 bg-primary text-on-primary-container font-label-md font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center"
                  >
                    {infoLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                  </button>
                </form>
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-6">
              <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-secondary">security</span>
                Đổi mật khẩu
              </h4>
              <div className="glass-panel p-8 rounded-3xl space-y-6">
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-on-surface-variant font-label-sm ml-1">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-on-surface-variant font-label-sm ml-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md"
                      placeholder="Mật khẩu tối thiểu 8 ký tự"
                      required
                    />
                  </div>

                  {passwordMessage && (
                    <p className={`text-label-sm font-semibold ml-1 ${passwordMessage.includes('thành công') ? 'text-secondary' : 'text-error'}`}>
                      {passwordMessage}
                    </p>
                  )}

                  <button 
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-3 bg-surface-variant text-on-surface font-label-md font-bold rounded-xl hover:bg-surface-container-highest active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center"
                  >
                    {passwordLoading ? 'Đang xác nhận...' : 'Xác nhận thay đổi'}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Payment Info */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-secondary">credit_card</span>
                Thông tin thanh toán
              </h4>
              <button 
                onClick={() => {
                  setCardMessage('');
                  setShowAddCard(true);
                }}
                className="text-primary font-label-md font-bold flex items-center gap-2 border border-transparent hover:border-primary px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Thêm phương thức
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.paymentMethods && user.paymentMethods.length > 0 ? (
                user.paymentMethods.map((card) => (
                  <div key={card._id} className="glass-panel p-6 rounded-2xl flex items-center justify-between group accent-glow transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 bg-white/5 rounded flex items-center justify-center p-2 flex-shrink-0">
                        {card.brand.toLowerCase() === 'visa' ? (
                          <span className="font-bold text-lg text-primary tracking-widest italic select-none">VISA</span>
                        ) : card.brand.toLowerCase() === 'mastercard' ? (
                          <span className="font-bold text-lg text-secondary tracking-widest italic select-none">MC</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">payment</span>
                        )}
                      </div>
                      <div>
                        {/* Name of Card */}
                        <p className="text-on-surface font-semibold text-label-md leading-tight">{card.cardholderName || 'Wesley Listener'}</p>
                        {/* Down line ... 4 digits */}
                        <p className="text-on-surface-variant text-sm mt-1">... {card.last4}</p>
                        <p className="text-on-surface-variant text-[11px] opacity-70 mt-0.5">Hết hạn {card.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {card.isDefault ? (
                        <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] rounded border border-secondary/20 font-bold uppercase select-none">Mặc định</span>
                      ) : (
                        <button 
                          onClick={() => handleSetDefaultCard(card._id)}
                          className="px-2 py-1 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white text-[10px] rounded border border-white/10 font-bold uppercase cursor-pointer transition-colors"
                        >
                          Đặt mặc định
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteCard(card._id)}
                        className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                        title="Xóa thẻ"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 glass-panel p-8 rounded-2xl text-center text-on-surface-variant">
                  <p className="font-body-md">Chưa có phương thức thanh toán nào.</p>
                </div>
              )}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="p-8 rounded-3xl border border-error/20 bg-error-container/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 select-none">
              <span className="material-symbols-outlined text-[80px] text-error">warning</span>
            </div>
            <div className="relative z-10">
              <h4 className="font-headline-md text-headline-md text-error flex items-center gap-3 mb-4 font-bold">
                <span className="material-symbols-outlined">report</span>
                Xóa tài khoản
              </h4>
              <p className="text-on-surface-variant font-body-md mb-6 max-w-2xl">
                Việc xóa tài khoản sẽ gỡ bỏ vĩnh viễn tất cả danh sách phát, bài hát đã tải lên và lịch sử nghe nhạc của bạn. Hành động này không thể hoàn tác.
              </p>
              <button 
                onClick={() => setShowDeleteAccountConfirm(true)}
                className="px-8 py-3 bg-error text-on-error font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-error/20"
              >
                Tiếp tục xóa tài khoản
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* Add Payment Method Modal */}
      {showAddCard && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 relative shadow-2xl">
            <button 
              onClick={() => setShowAddCard(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-headline-md text-headline-md text-white mb-6 font-bold">Thêm phương thức thanh toán</h3>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Số thẻ</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Ví dụ: 4242 4242 4242 4242"
                  maxLength="19"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Tên chủ thẻ</label>
                <input 
                  type="text" 
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Ví dụ: NGUYEN VAN FELIX"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm text-on-surface-variant mb-2">Mã bảo mật (CVV)</label>
                  <input 
                    type="password" 
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="Ví dụ: 123"
                    maxLength="4"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-on-surface-variant mb-2">Hạn sử dụng</label>
                  <input 
                    type="text" 
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="Ví dụ: 12/2026"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-body-md text-white focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox"
                  id="cardIsDefault"
                  checked={cardIsDefault}
                  onChange={(e) => setCardIsDefault(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary bg-surface-container"
                />
                <label htmlFor="cardIsDefault" className="text-body-md text-on-surface-variant cursor-pointer select-none">Đặt làm phương thức thanh toán mặc định</label>
              </div>

              {cardMessage && (
                <p className="text-label-sm font-semibold text-error ml-1">
                  {cardMessage}
                </p>
              )}

              <button 
                type="submit" 
                disabled={cardLoading}
                className="w-full py-3 bg-primary text-on-primary-container rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer flex justify-center items-center mt-6"
              >
                {cardLoading ? 'Đang thêm...' : 'Thêm thẻ'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Confirmation Warning Modal */}
      {showDeleteAccountConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-sm border border-error/20 relative shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-error text-6xl mb-4 select-none animate-bounce">warning</span>
              <h3 className="font-headline-md text-headline-md text-white mb-2 font-bold">Cảnh Báo Xóa Tài Khoản</h3>
              <p className="text-on-surface-variant font-body-md text-body-md mb-6">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không? Hành động này sẽ xóa toàn bộ danh sách phát, bài hát đã tải lên và không thể hoàn tác.
              </p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  className="flex-1 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 bg-error text-on-error rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <MusicPlayer />
    </>
  );
};

export default Settings;
