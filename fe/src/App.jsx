import './App.css';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';
import Home from './routes/Home';
import ArtistDashboard from './routes/ArtistDashboard';
import FullscreenPlayer from './routes/FullscreenPlayer';
import ArtistDetail from './routes/ArtistDetail';
import UploadManage from './routes/UploadManage';
import Auth from './routes/Auth';
import SearchResults from './routes/SearchResults';
import AdminDashboard from './routes/AdminDashboard';
import LibraryPlaylists from './routes/LibraryPlaylists';
import NotificationsSocial from './routes/NotificationsSocial';
import PlaylistDetail from './routes/PlaylistDetail';
import Settings from './routes/Settings';
import SubscriptionPlans from './routes/SubscriptionPlans';
import PaymentConfirm from './routes/PaymentConfirm';
import PaymentHistory from './routes/PaymentHistory';
import PaymentCC from './routes/PaymentCC';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary gap-4">
        <span className="material-symbols-outlined text-5xl animate-spin">sync</span>
        <span className="font-headline-md text-headline-md font-bold">Melodies Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="" element={<Navigate to="/home" />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected Routes */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/player" element={
        <ProtectedRoute>
          <FullscreenPlayer />
        </ProtectedRoute>
      } />
      <Route path="/artist-detail" element={
        <ProtectedRoute>
          <ArtistDetail />
        </ProtectedRoute>
      } />
      <Route path="/search-results" element={
        <ProtectedRoute>
          <SearchResults />
        </ProtectedRoute>
      } />
      <Route path="/library-playlists" element={
        <ProtectedRoute>
          <LibraryPlaylists />
        </ProtectedRoute>
      } />
      <Route path="/playlist-detail" element={
        <ProtectedRoute>
          <PlaylistDetail />
        </ProtectedRoute>
      } />
      <Route path="/notifications-social" element={
        <ProtectedRoute>
          <NotificationsSocial />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Subscription & Payment */}
      <Route path="/subscription-plans" element={
        <ProtectedRoute>
          <SubscriptionPlans />
        </ProtectedRoute>
      } />
      <Route path="/payment-confirm" element={
        <ProtectedRoute>
          <PaymentConfirm />
        </ProtectedRoute>
      } />
      <Route path="/payment-history" element={
        <ProtectedRoute>
          <PaymentHistory />
        </ProtectedRoute>
      } />
      <Route path="/payment-cc" element={
        <ProtectedRoute>
          <PaymentCC />
        </ProtectedRoute>
      } />


      {/* Artist & Admin only */}
      <Route path="/artist-dashboard" element={
        <ProtectedRoute allowedRoles={['artist', 'admin']}>
          <ArtistDashboard />
        </ProtectedRoute>
      } />
      <Route path="/upload-manage" element={
        <ProtectedRoute allowedRoles={['artist', 'admin']}>
          <UploadManage />
        </ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

import { LanguageProvider } from './context/LanguageContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const mains = document.querySelectorAll('main');
    mains.forEach(el => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PlayerProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
