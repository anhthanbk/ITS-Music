import { create } from 'zustand';
import { ThemeMode } from '../types/music';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'its_music_theme';

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'zing-purple';
  
  return {
    theme: saved,
    setTheme: (theme) => {
      localStorage.setItem(STORAGE_KEY, theme);
      set({ theme });
    },
  };
});
