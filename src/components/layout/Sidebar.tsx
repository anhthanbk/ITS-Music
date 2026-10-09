import React from 'react';
import {
  Compass,
  TrendingUp,
  FolderHeart,
  Database,
  Radio,
  PlusCircle,
  Headphones,
  Sparkles,
  Music4,
  Upload,
} from 'lucide-react';
import { ActiveTab, Playlist } from '../../types/music';
import { useMusicStore } from '../../store/useMusicStore';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenUploadSong?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreatePlaylist,
  onSelectPlaylist,
  onOpenUploadSong,
}) => {
  const { playlists } = useMusicStore();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; isNew?: boolean }[] = [
    { id: 'discover', label: 'Khám phá', icon: <Compass className="w-5 h-5" /> },
    { id: 'chart', label: '#itsChart', icon: <TrendingUp className="w-5 h-5 text-amber-400" />, isNew: true },
    { id: 'genres', label: 'Thể loại & Chủ đề', icon: <Radio className="w-5 h-5" /> },
    { id: 'library', label: 'Thư viện cá nhân', icon: <FolderHeart className="w-5 h-5" /> },
    { id: 'crud', label: 'Quản lý Dữ liệu (CRUD)', icon: <Database className="w-5 h-5 text-emerald-400" /> },
  ];

  return (
    <aside className="w-60 md:w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col h-[calc(100vh-5.5rem)] shrink-0 select-none">
      {/* Brand Wordmark */}
      <div className="h-18 px-6 flex items-center gap-2.5 border-b border-[var(--border-subtle)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Headphones className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-black text-white tracking-tight flex items-center gap-1">
            ITS <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Music</span>
          </span>
          <p className="text-[10px] text-neutral-400 font-medium">Zing MP3 Experience</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-md shadow-purple-900/20'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.isNew && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                  HOT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Upload Song Action */}
      {onOpenUploadSong && (
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={onOpenUploadSong}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải bài hát lên</span>
          </button>
        </div>
      )}

      <div className="mx-4 my-2 border-t border-[var(--border-subtle)]" />

      {/* Playlist Section */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-neutral-400 tracking-wider">
            PLAYLIST CỦA BẠN
          </span>
          <button
            type="button"
            onClick={onOpenCreatePlaylist}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Tạo playlist mới"
          >
            <PlusCircle className="w-4 h-4 text-[var(--accent)]" />
          </button>
        </div>

        <div className="space-y-1 flex-1">
          {playlists.length === 0 ? (
            <div className="py-4 px-2 text-center text-[11px] text-neutral-500 rounded-xl bg-white/2 border border-white/5">
              Chưa có playlist nào
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onSelectPlaylist(pl)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-white/10">
                  <img src={pl.coverUrl} alt={pl.title} className="w-full h-full object-cover" />
                </div>
                <span className="truncate flex-1 font-medium group-hover:text-[var(--accent)]">
                  {pl.title}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {pl.songIds.length}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Promo VIP Card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-black/40 border border-purple-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nghe nhạc không quảng cáo</span>
          </div>
          <p className="text-[11px] text-neutral-300 mb-2 leading-relaxed">
            Âm thanh Lossless 320kbps & kho nhạc VIP độc quyền
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
          >
            Nâng cấp VIP ngay
          </button>
        </div>
      </div>
    </aside>
  );
};
