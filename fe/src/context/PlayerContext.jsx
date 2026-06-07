import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { api } from '../utils/api.js';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('all'); // 'none' | 'all' | 'one'

  const audioRef = useRef(new Audio());
  const trackTimerRef = useRef(null);
  const isTrackedRef = useRef(false);

  // Set audio volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Track play count if played > 30 seconds
      if (currentSong && !isTrackedRef.current && audio.currentTime >= 30) {
        isTrackedRef.current = true;
        api.post(`/songs/${currentSong._id}/play`).catch(err => 
          console.error('Failed to log song view:', err)
        );
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, queue, queueIndex, shuffle, repeat]);

  // Handle playing changes
  useEffect(() => {
    if (currentSong) {
      const fullUrl = currentSong.audioUrl.startsWith('http') 
        ? currentSong.audioUrl 
        : `http://localhost:8080${currentSong.audioUrl}`;
      
      if (audioRef.current.src !== fullUrl) {
        audioRef.current.src = fullUrl;
        isTrackedRef.current = false;
      }

      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  const play = (song, newQueue = []) => {
    if (!song) return;
    
    // Wire queue
    if (newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex(s => s._id === song._id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      setQueue([song]);
      setQueueIndex(0);
    }

    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!currentSong && queue.length > 0) {
      play(queue[0], queue);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setCurrentTime(0);
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      setCurrentSong(queue[randomIndex]);
      setIsPlaying(true);
      setCurrentTime(0);
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setIsPlaying(true);
      setCurrentTime(0);
    } else {
      if (repeat === 'all') {
        setQueueIndex(0);
        setCurrentSong(queue[0]);
        setIsPlaying(true);
        setCurrentTime(0);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
      setCurrentTime(0);
    } else {
      if (repeat === 'all') {
        const lastIndex = queue.length - 1;
        setQueueIndex(lastIndex);
        setCurrentSong(queue[lastIndex]);
        setIsPlaying(true);
        setCurrentTime(0);
      } else {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    }
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    localStorage.setItem('player_volume', clamped);
  };

  const toggleShuffle = () => setShuffle(!shuffle);

  const toggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      queue,
      queueIndex,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      play,
      togglePlay,
      next: handleNext,
      prev: handlePrev,
      seek,
      changeVolume,
      toggleShuffle,
      toggleRepeat
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
