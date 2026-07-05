import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../utils/api.js';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Audio state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loopMode, setLoopMode] = useState('none'); // 'none', 'single', 'all'
  const [isShuffle, setIsShuffle] = useState(false);

  // Ad playing state
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [activeAd, setActiveAd] = useState(null);
  const [songsPlayedCount, setSongsPlayedCount] = useState(0);

  // HTML Audio element ref
  const audioRef = useRef(new Audio());
  const preloadAudioRef = useRef(null);

  // Tracking for stream count (>= 30s)
  const listenTimeRef = useRef(0);
  const streamRegisteredRef = useRef(false);
  const lastTimeRef = useRef(0);

  // Resume state ref for cold start seeking
  const resumeTimeRef = useRef(0);

  const getAudioUrlForUser = (song) => {
    if (!song) return '';
    // If premium, play high quality 320kbps
    if (user && user.premium_status === 'PREMIUM' && song.audio_source?.stream_320kbps_url) {
      return song.audio_source.stream_320kbps_url;
    }
    // Else play standard 128kbps or main URL
    return song.audio_source?.stream_128kbps_url || song.audioUrl;
  };

  // Sync volume
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Load resume details from localStorage (soft storage cold start)
  useEffect(() => {
    const savedSongId = localStorage.getItem('melodies_resume_song_id');
    const savedTime = parseFloat(localStorage.getItem('melodies_resume_time') || '0');
    const savedQueueStr = localStorage.getItem('melodies_resume_queue');
    const savedIndexStr = localStorage.getItem('melodies_resume_index');

    if (savedSongId && savedQueueStr) {
      try {
        const parsedQueue = JSON.parse(savedQueueStr);
        const parsedIndex = parseInt(savedIndexStr || '-1', 10);
        const songToResume = parsedQueue[parsedIndex] || parsedQueue.find(s => s._id === savedSongId);

        if (songToResume) {
          setCurrentSong(songToResume);
          setQueue(parsedQueue);
          setCurrentIndex(parsedIndex !== -1 ? parsedIndex : parsedQueue.findIndex(s => s._id === savedSongId));
          
          resumeTimeRef.current = savedTime;
          audioRef.current.src = getAudioUrlForUser(songToResume);
          setCurrentTime(savedTime);
          lastTimeRef.current = savedTime;
        }
      } catch (err) {
        console.error('Failed to parse resume state:', err.message);
      }
    }
  }, []);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Save current time and song info to localStorage (soft storage resume feature)
      if (!isAdPlaying && currentSong) {
        const lastSavedTime = parseFloat(localStorage.getItem('melodies_resume_time') || '0');
        if (Math.abs(audio.currentTime - lastSavedTime) >= 1) {
          localStorage.setItem('melodies_resume_song_id', currentSong._id);
          localStorage.setItem('melodies_resume_time', audio.currentTime.toString());
          localStorage.setItem('melodies_resume_queue', JSON.stringify(queue));
          localStorage.setItem('melodies_resume_index', currentIndex.toString());
        }
      }

      // Accumulate listening time for stream count
      if (!isAdPlaying && currentSong) {
        const delta = audio.currentTime - lastTimeRef.current;
        // Check if user played normally (no forward jumps)
        if (delta > 0 && delta < 2) {
          listenTimeRef.current += delta;
          if (listenTimeRef.current >= 30 && !streamRegisteredRef.current) {
            streamRegisteredRef.current = true;
            // Trigger stream count API
            api.post(`/songs/${currentSong._id}/stream`, { durationListened: Math.floor(listenTimeRef.current) })
              .catch(err => console.error('Failed to register stream:', err.message));
          }
        }
        lastTimeRef.current = audio.currentTime;

        // Gapless Preloading: 3 seconds before completion
        if (audio.duration && audio.duration - audio.currentTime <= 3) {
          preloadNextSong();
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (resumeTimeRef.current > 0) {
        audio.currentTime = resumeTimeRef.current;
        resumeTimeRef.current = 0;
      }
    };

    const handleEnded = () => {
      if (isAdPlaying) {
        handleAdFinished();
      } else {
        handleSongFinished();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, queue, currentIndex, loopMode, isShuffle, isAdPlaying, songsPlayedCount]);

  // Preload helper
  const preloadNextSong = () => {
    if (preloadAudioRef.current) return; // already preloaded or preloading
    
    const nextIdx = getNextIndex();
    if (nextIdx !== -1 && queue[nextIdx]) {
      const nextSong = queue[nextIdx];
      const audioUrl = getAudioUrlForUser(nextSong);
      preloadAudioRef.current = new Audio(audioUrl);
      preloadAudioRef.current.preload = 'auto';
      console.log(`🚀 Preloading next track: "${nextSong.title}" for gapless playback...`);
    }
  };

  const playSong = async (song, newQueue = null, indexInQueue = -1, bypassAd = false) => {
    // If ad is playing, block switching songs
    if (isAdPlaying && !bypassAd) return;

    // Reset resumeTimeRef on manual play
    resumeTimeRef.current = 0;

    const finalQueue = newQueue || queue;
    const finalIndex = indexInQueue !== -1 ? indexInQueue : currentIndex;

    if (newQueue) {
      setQueue(newQueue);
      setCurrentIndex(indexInQueue);
    }

    // Reset streams tracking
    listenTimeRef.current = 0;
    streamRegisteredRef.current = false;

    // Check if we need to trigger an Ad for Free user when transitioning between different songs
    if (user && user.premium_status !== 'PREMIUM' && !bypassAd && currentSong && currentSong._id !== song._id) {
      triggerAudioAd(song, newQueue, indexInQueue);
      return;
    }

    setCurrentSong(song);
    audioRef.current.src = getAudioUrlForUser(song);
    lastTimeRef.current = 0;

    // Save to localStorage immediately on play start
    localStorage.setItem('melodies_resume_song_id', song._id);
    localStorage.setItem('melodies_resume_time', '0');
    localStorage.setItem('melodies_resume_queue', JSON.stringify(finalQueue));
    localStorage.setItem('melodies_resume_index', finalIndex.toString());
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio play failed:', err.message);
    }

    // Clear preload
    preloadAudioRef.current = null;
  };

  // Triggering Audio Ad
  const triggerAudioAd = async (pendingSong, pendingQueue, pendingIndex) => {
    try {
      console.log('📢 Triggering audio advertisement for Free tier user...');
      const ad = await api.get('/admin/ads/serve-random');
      setIsAdPlaying(true);
      setActiveAd(ad);
      
      // Store pending song payload to play after ad finishes
      audioRef.current.src = ad.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'; // fallback ad sound
      await audioRef.current.play();
      setIsPlaying(true);

      // Save pending song info in ref to access when ad finished
      audioRef.current.pendingData = { pendingSong, pendingQueue, pendingIndex };
    } catch (err) {
      console.log('No ads available or failed to serve, playing song directly:', err.message);
      // Play directly if error
      setIsAdPlaying(false);
      setActiveAd(null);
      setSongsPlayedCount(1);
      setCurrentSong(pendingSong);
      audioRef.current.src = getAudioUrlForUser(pendingSong);
      await audioRef.current.play().catch(e => console.log(e));
    }
  };

  const handleAdFinished = async () => {
    setIsAdPlaying(false);
    setActiveAd(null);
    setSongsPlayedCount(0); // reset count
    console.log('📢 Ad completed, resuming music playback...');

    const pending = audioRef.current.pendingData;
    if (pending) {
      const { pendingSong, pendingQueue, pendingIndex } = pending;
      audioRef.current.pendingData = null;
      playSong(pendingSong, pendingQueue, pendingIndex, true);
    } else {
      // If no pending, play next
      playNext(true);
    }
  };

  const handleSongFinished = () => {
    if (loopMode === 'single') {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log(e));
      listenTimeRef.current = 0;
      streamRegisteredRef.current = false;
    } else {
      playNext();
    }
  };

  const playNext = (bypassAd = false) => {
    if (isAdPlaying) return;
    const nextIdx = getNextIndex();
    if (nextIdx !== -1 && queue[nextIdx]) {
      playSong(queue[nextIdx], queue, nextIdx, bypassAd);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrev = (bypassAd = false) => {
    if (isAdPlaying) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = loopMode === 'all' ? queue.length - 1 : 0;
    }
    if (queue[prevIdx]) {
      playSong(queue[prevIdx], queue, prevIdx, bypassAd);
    }
  };

  const getNextIndex = () => {
    if (queue.length === 0) return -1;
    
    if (isShuffle) {
      return Math.floor(Math.random() * queue.length);
    }

    let nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) {
      nextIdx = loopMode === 'all' ? 0 : -1;
    }
    return nextIdx;
  };

  const togglePlay = () => {
    if (isAdPlaying) return; // disable during ads
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (currentSong) {
        audioRef.current.play().catch(e => console.log(e));
      }
    }
  };

  const seek = (time) => {
    if (isAdPlaying) return; // disable scrubbing during ads
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    lastTimeRef.current = time;
  };

  const addToQueue = (song) => {
    setQueue(prev => {
      if (prev.some(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      setVolume,
      isMuted,
      setIsMuted,
      queue,
      setQueue,
      currentIndex,
      loopMode,
      setLoopMode,
      isShuffle,
      setIsShuffle,
      isAdPlaying,
      activeAd,
      playSong,
      playNext,
      playPrev,
      togglePlay,
      seek,
      addToQueue
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
