import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Palette,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Play,
  Heart,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { ThemeMode } from '../../types/music';
import { supabase } from '../../supabaseClient.js';
import { uploadFileToStorage } from '../../lib/storage';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenUploadSong?: () => void;
  onBack?: () => void;
  onForward?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenUploadSong,
  onBack,
  onForward,
}) => {
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { songs, searchQuery, setSearchQuery } = useMusicStore();
  const { playSong } = usePlayerStore();

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themesList: { id: ThemeMode; name: string; color: string }[] = [
    { id: 'zing-purple', name: 'ITS Classic Tím', color: '#9b4de0' },
    { id: 'midnight-dark', name: 'Midnight Xanh Thẳm', color: '#3b82f6' },
    { id: 'emerald-dark', name: 'Emerald Xanh Ngọc', color: '#10b981' },
    { id: 'rose-dark', name: 'Rose Đỏ Rượu', color: '#f43f5e' },
  ];

  const searchResults = searchQuery.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-18 px-6 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 z-30">
      {/* 1. Left: Navigation arrows & Search bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onForward}
            className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Tiến tới"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Input */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Tìm kiếm bài hát, nghệ sĩ, lời bài hát..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white/5 focus:bg-white/10 border border-white/10 focus:border-[var(--accent)] rounded-full text-white placeholder-neutral-400 outline-none transition-colors"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-12 left-0 right-0 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2 shadow-2xl z-50 max-h-80 overflow-y-auto animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400">
                GỢI Ý TÌM KIẾM ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  Không tìm thấy bài hát nào phù hợp với "{searchQuery}"
                </div>
              ) : (
                searchResults.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      playSong(song);
                      setShowSearchDropdown(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative">
                      <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-[var(--accent)]">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">
                        {song.artist} · {song.genre}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Actions: Theme, Supabase Status, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Upload Song button */}
        {onOpenUploadSong && (
          <button
            type="button"
            onClick={onOpenUploadSong}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            title="Tải bài hát lên Supabase Storage"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải nhạc lên</span>
          </button>
        )}

        {/* Theme Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Đổi chủ đề giao diện ITS Music"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-12 w-48 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2 shadow-2xl z-50 animate-in fade-in duration-100">
              <div className="px-2 py-1.5 text-[11px] font-bold text-neutral-400">
                CHỌN CHỦ ĐỀ GIAO DIỆN
              </div>
              {themesList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    document.documentElement.setAttribute('data-theme', t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    theme === t.id
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Auth */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={user.fullName}
                className="w-7 h-7 rounded-full object-cover border border-purple-400"
              />
              <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden sm:inline">
                {user.fullName}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-2 shadow-2xl z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                    Thành viên ITS Music
                  </span>
                </div>

                <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Đổi ảnh đại diện (Storage)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { signedUrl } = await uploadFileToStorage({
                          file,
                          featureName: 'avatars',
                        });
                        await supabase.auth.updateUser({
                          data: { avatar_url: signedUrl },
                        });
                        useAuthStore.getState().checkSession();
                        setShowUserMenu(false);
                      } catch (err) {
                        console.warn('Error uploading avatar:', err);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={async () => {
                    setShowUserMenu(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
