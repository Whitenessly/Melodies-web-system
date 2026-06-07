import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng điền email và mật khẩu');
      return;
    }
    if (mode === 'signup' && !name) {
      setErrorMsg('Vui lòng điền họ và tên');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        const role = isArtist ? 'artist' : 'listener';
        await register(name, email, password, role);
      }
      navigate('/home');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Xác thực thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="flex flex-col md:flex-row min-h-screen w-full bg-background">
        {/* Left artistic panel */}
        <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Elevate Your Sound Experience" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoxo5RnOtGieoIRYT7kcCg0pwDB3IcykS0LR3hdfEPY1FE1sB5nN-WOIZavFX1Fa1zJerfQ6TySA5GDUevbAyxjDYlTGkoI-JlFTZRoQl3r5_kXe_KizujAkuZxhZQMlsPFYLFLnWh_6xjryJVNBQTdud_h-Il6DFh1YXmVcKxlvR2eXGwTDl1FFkx9p4e-YWPulsUsG7yhV7CyXGLKf7aw8EdehIEIzOvrX5U89uQ2xXyTaH1bLxRiGmT1E_mw55RptgTwl8t6Qk" 
            />
            <div className="hero-gradient absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-margin-page">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
              </div>
              <span className="font-headline-lg text-headline-lg text-primary tracking-tighter">Melodies</span>
            </div>
            
            <div className="max-w-2xl mt-auto mb-12">
              <h1 className="font-headline-xl text-headline-xl text-white mb-6 leading-tight">
                Elevate Your <br />
                <span className="text-primary italic">Sound Experience</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant/80 max-w-lg">
                Khám phá không gian âm nhạc đỉnh cao với chất lượng âm thanh lossless và những bản phối độc quyền dành riêng cho tâm hồn nghệ sĩ của bạn.
              </p>
            </div>
            
            <div className="flex gap-8 items-center font-label-md text-label-md text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified</span>
                Nghệ sĩ xác thực
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">graphic_eq</span>
                Âm thanh Ethereal
              </span>
            </div>
          </div>
        </section>

        {/* Right Auth Panel */}
        <section className="flex-1 flex flex-col justify-center items-center px-gutter-mobile py-12 md:px-gutter-desktop lg:px-24 bg-surface-container-lowest/20 backdrop-blur-md">
          <div className="w-full max-w-md space-y-8">
            <div className="md:hidden flex flex-col items-center mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
              </div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-white">Chào mừng bạn</h2>
            </div>

            {/* Tab switchers */}
            <div className="glass-panel p-1 rounded-xl flex">
              <button 
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg font-label-md text-label-md transition-all duration-300 cursor-pointer ${mode === 'signin' ? 'bg-primary text-on-primary shadow-lg font-bold' : 'text-on-surface-variant hover:text-white'}`}
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
              >
                Đăng nhập
              </button>
              <button 
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg font-label-md text-label-md transition-all duration-300 cursor-pointer ${mode === 'signup' ? 'bg-primary text-on-primary shadow-lg font-bold' : 'text-on-surface-variant hover:text-white'}`}
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
              >
                Đăng ký
              </button>
            </div>

            {/* Form */}
            <div className="mt-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant ml-1">Họ và tên</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                      <input 
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                        placeholder="Nguyễn Văn A" 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Email</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">alternate_email</span>
                    <input 
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="name@example.com" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1">Mật khẩu</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                    <input 
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-outline/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-white cursor-pointer" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">mic</span>
                      <div>
                        <p className="font-label-md text-label-md text-white">Đăng ký làm Nghệ sĩ</p>
                        <p className="text-[11px] text-on-surface-variant">Phân phối nhạc & xem Analytics</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        className="sr-only peer" 
                        type="checkbox" 
                        checked={isArtist}
                        onChange={(e) => setIsArtist(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-error text-label-sm font-semibold">{errorMsg}</p>
                )}

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      className="w-4 h-4 rounded border-outline-variant/50 bg-surface-container text-primary focus:ring-primary/20 cursor-pointer" 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-white transition-colors">Ghi nhớ tôi</span>
                  </label>
                  <Link className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors" to="#">Quên mật khẩu?</Link>
                </div>

                <button 
                  className="w-full py-4 bg-primary text-on-primary font-headline-md text-headline-md rounded-xl shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-bold disabled:opacity-50" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : (mode === 'signin' ? 'Đăng nhập' : 'Đăng ký tài khoản')}
                </button>
              </form>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-label-sm uppercase">
                <span className="bg-surface-container-lowest px-4 text-outline">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 px-4 glass-panel rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 5.04c1.94 0 3.5.72 4.39 1.55l3.27-3.27C17.6 1.42 15.02 0 12 0 7.33 0 3.32 2.67 1.34 6.6l3.85 2.99C6.1 7.19 8.82 5.04 12 5.04z" fill="#EA4335"></path>
                  <path d="M22.65 12.27c0-.78-.07-1.54-.2-2.27H12v4.29h6c-.26 1.37-1.04 2.53-2.21 3.31l3.44 2.67c2.01-1.85 3.17-4.58 3.17-8z" fill="#FBBC05"></path>
                  <path d="M5.19 14.59c-.24-.69-.37-1.42-.37-2.18s.13-1.49.37-2.18L1.34 7.24C.49 8.99 0 10.94 0 13s.49 4.01 1.34 5.76l3.85-3.17z" fill="#4285F4"></path>
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.44-2.67c-1.1.74-2.5 1.18-4.49 1.18-3.18 0-5.9-2.15-6.86-5.04l-3.85 2.99C3.32 21.33 7.33 24 12 24z" fill="#34A853"></path>
                </svg>
                <span className="font-label-md text-label-md text-white">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 glass-panel rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                <span className="font-label-md text-label-md text-white">Facebook</span>
              </button>
            </div>

            <p className="text-center font-label-sm text-label-sm text-on-surface-variant pt-8">
              Bằng cách tiếp tục, bạn đồng ý với <Link className="text-primary hover:underline" to="#">Điều khoản Dịch vụ</Link> và <Link className="text-primary hover:underline" to="#">Chính sách Bảo mật</Link> của Melodies.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Auth;
