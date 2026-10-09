import { create } from 'zustand';
import { Song, RepeatMode, AudioQuality } from '../types/music';
import { useMusicStore } from './useMusicStore';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  queue: Song[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  audioQuality: AudioQuality;
  isKaraokeOpen: boolean;
  isQueueOpen: boolean;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  playPlaylist: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setKaraokeOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateCurrentSong: (song: Song) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,
  isShuffled: false,
  repeatMode: 'all',
  audioQuality: '320kbps',
  isKaraokeOpen: false,
  isQueueOpen: false,

  playSong: (song, newQueue) => {
    const state = get();
    let updatedQueue = newQueue || state.queue;
    let index = updatedQueue.findIndex((s) => s.id === song.id);

    if (index === -1) {
      updatedQueue = [...updatedQueue, song];
      index = updatedQueue.length - 1;
    }

    set({
      currentSong: song,
      isPlaying: true,
      queue: updatedQueue,
      queueIndex: index,
      currentTime: 0,
    });

    try {
      useMusicStore.getState().recordPlay(song.id);
    } catch {
      // ignore
    }
  },

  playPlaylist: (songs, startIndex = 0) => {
    if (!songs.length) return;
    const songToPlay = songs[startIndex] || songs[0];
    set({
      queue: songs,
      queueIndex: startIndex,
      currentSong: songToPlay,
      isPlaying: true,
      currentTime: 0,
    });

    if (songToPlay) {
      try {
        useMusicStore.getState().recordPlay(songToPlay.id);
      } catch {
        // ignore
      }
    }
  },

  togglePlay: () => {
    const { isPlaying, currentSong, queue } = get();
    if (!currentSong && queue.length > 0) {
      set({ currentSong: queue[0], queueIndex: 0, isPlaying: true });
      return;
    }
    set({ isPlaying: !isPlaying });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  nextSong: () => {
    const { queue, queueIndex, isShuffled, repeatMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ currentTime: 0, isPlaying: true });
      return;
    }

    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      set({
        queueIndex: randomIndex,
        currentSong: queue[randomIndex],
        currentTime: 0,
        isPlaying: true,
      });
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      set({
        queueIndex: nextIndex,
        currentSong: queue[nextIndex],
        currentTime: 0,
        isPlaying: true,
      });
    } else if (repeatMode === 'all') {
      set({
        queueIndex: 0,
        currentSong: queue[0],
        currentTime: 0,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  prevSong: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    if (currentTime > 3) {
      // Seek to start if already played more than 3 seconds
      set({ currentTime: 0 });
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      set({
        queueIndex: prevIndex,
        currentSong: queue[prevIndex],
        currentTime: 0,
        isPlaying: true,
      });
    } else {
      // Loop to last track if repeat all
      const lastIndex = queue.length - 1;
      set({
        queueIndex: lastIndex,
        currentSong: queue[lastIndex],
        currentTime: 0,
        isPlaying: true,
      });
    }
  },

  seek: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  toggleRepeat: () => {
    const current = get().repeatMode;
    const next: RepeatMode = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
  },

  setAudioQuality: (audioQuality) => set({ audioQuality }),
  setKaraokeOpen: (isKaraokeOpen) => set({ isKaraokeOpen }),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),

  addToQueue: (song) => {
    const { queue } = get();
    if (queue.some((s) => s.id === song.id)) return;
    set({ queue: [...queue, song] });
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex } = get();
    const updated = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;
    if (index < queueIndex) {
      newIndex = queueIndex - 1;
    } else if (index === queueIndex) {
      newIndex = Math.min(queueIndex, updated.length - 1);
    }
    set({ queue: updated, queueIndex: newIndex });
  },

  clearQueue: () => set({ queue: [], queueIndex: -1, currentSong: null, isPlaying: false }),

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  updateCurrentSong: (updatedSong) => {
    const { queue, queueIndex, currentSong } = get();
    const newQueue = queue.map((s) => (s.id === updatedSong.id ? updatedSong : s));
    const newCurrentSong = currentSong?.id === updatedSong.id ? updatedSong : currentSong;
    set({ queue: newQueue, currentSong: newCurrentSong });
  },
}));
