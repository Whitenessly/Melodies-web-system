import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (token) => {
    try {
      const data = await api.get('/auth/profile');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const toggleLikeSong = async (songId) => {
    const data = await api.post('/users/likes', { songId });
    setUser(prev => {
      if (!prev) return null;
      const likedSongs = prev.likedSongs ? [...prev.likedSongs] : [];
      const index = likedSongs.indexOf(songId);
      if (index === -1) {
        likedSongs.push(songId);
      } else {
        likedSongs.splice(index, 1);
      }
      return { ...prev, likedSongs };
    });
    return data.liked;
  };

  const updateProfile = async (name) => {
    const data = await api.put('/auth/profile', { name });
    setUser(prev => prev ? { ...prev, name: data.user.name } : null);
    return data.user;
  };

  const toggleFollowArtist = async (artistId) => {
    const data = await api.post('/users/follow', { artistId });
    setUser(prev => {
      if (!prev) return null;
      const following = prev.following ? [...prev.following] : [];
      const index = following.indexOf(artistId);
      if (index === -1) {
        following.push(artistId);
      } else {
        following.splice(index, 1);
      }
      return { ...prev, following };
    });
    return data.followed;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, toggleLikeSong, toggleFollowArtist }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
