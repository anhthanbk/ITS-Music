export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  region: 'vpop' | 'usuk' | 'kpop' | 'other';
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  lyrics?: LyricLine[];
  playsCount: number;
  rank?: number;
  rankChange?: 'up' | 'down' | 'same';
  createdAt: string;
  userId?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  songIds: string[];
  userId?: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface ChartDataPoint {
  hour: string; // "00:00", "02:00", ...
  song1Listens: number;
  song2Listens: number;
  song3Listens: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
}

export type AudioQuality = '128kbps' | '320kbps' | 'lossless';
export type RepeatMode = 'off' | 'all' | 'one';
export type ActiveTab = 'discover' | 'chart' | 'library' | 'crud' | 'genres';
export type ThemeMode = 'zing-purple' | 'midnight-dark' | 'emerald-dark' | 'rose-dark';
