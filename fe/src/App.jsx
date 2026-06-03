import './App.css';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/artist-dashboard" element={<ArtistDashboard />} />
        <Route path="/player" element={<FullscreenPlayer />} />
        <Route path="/artist-detail" element={<ArtistDetail />} />
        <Route path="/upload-manage" element={<UploadManage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/library-playlists" element={<LibraryPlaylists />} />
        <Route path="/notifications-social" element={<NotificationsSocial />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
