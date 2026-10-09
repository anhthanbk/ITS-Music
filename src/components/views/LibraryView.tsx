import React, { useState } from 'react';
import {
  Heart,
  ListMusic,
  Play,
  Plus,
  Trash2,
  FolderHeart,
  Music,
} from 'lucide-react';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Playlist, Song } from '../../types/music';
import { ConfirmModal } from '../common/ConfirmModal';

interface LibraryViewProps {
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenCreatePlaylist,
  onSelectPlaylist,
}) => {
  const { songs, playlists, favorites, toggleFavorite, deletePlaylist } = useMusicStore();
  const { playSong, playPlaylist, currentSong, isPlaying } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists'>('favorites');
  const [deletePlCandidate, setDeletePlCandidate] = useState<Playlist | null>(null);
  const [isConfirmPlDeleteOpen, setIsConfirmPlDeleteOpen] = useState(false);

  const favoriteSongs = songs.filter((s) => favorites.includes(s.id));

  const handlePlayAllFavorites = () => {
    if (favoriteSongs.length > 0) {
      playPlaylist(favoriteSongs, 0);
    }
  };

  const handleConfirmDeletePlaylist = async () => {
    if (deletePlCandidate) {
      await deletePlaylist(deletePlCandidate.id);
      setDeletePlCandidate(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderHeart className="w-6 h-6 text-pink-400" />
            Thư Viện Cá Nhân
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Tất cả bài hát yêu thích và tuyển tập playlist của bạn
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Yêu thích ({favoriteSongs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'playlists'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlist ({playlists.length})</span>
          </button>
        </div>
      </div>

      {/* 2. FAVORITES TAB */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Có tổng cộng {favoriteSongs.length} bài hát được lưu vào mục yêu thích
            </span>
            {favoriteSongs.length > 0 && (
              <button
                type="button"
                onClick={handlePlayAllFavorites}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Phát tất cả</span>
              </button>
            )}
          </div>

          {favoriteSongs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
              <Heart className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-neutral-200">
                Chưa có bài hát yêu thích nào
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Hãy nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào để lưu vào đây!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, favoriteSongs)}
                    className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--accent-light)] border-[var(--accent)]/50'
                        : 'bg-white/5 hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <span className="text-xs font-mono text-neutral-500 w-6 text-center">
                      {idx + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-xs md:text-sm font-semibold truncate ${
                          isCurrent ? 'text-[var(--accent)]' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {song.artist}
                      </p>
                    </div>

                    <span className="hidden sm:inline px-2 py-0.5 rounded bg-white/10 text-neutral-300 text-xs">
                      {song.genre}
                    </span>

                    <span className="text-xs font-mono tabular-nums text-neutral-400 w-12 text-right">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song.id);
                      }}
                      className="p-2 text-pink-500 hover:text-neutral-400 rounded-full transition-colors cursor-pointer"
                      title="Bỏ thích"
                    >
                      <Heart className="w-4 h-4 fill-pink-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Danh sách playlist cá nhân của bạn
            </span>
            <button
              type="button"
              onClick={onOpenCreatePlaylist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo playlist mới</span>
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
              <ListMusic className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-neutral-200">
                Chưa có playlist nào
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Tạo playlist đầu tiên để tổng hợp các bài hát yêu thích của bạn!
              </p>
              <button
                type="button"
                onClick={onOpenCreatePlaylist}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo playlist ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group relative p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <img
                      src={pl.coverUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[var(--accent)]">
                        {pl.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {pl.songIds.length} bài hát
                      </p>
                    </div>

                    {pl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePlCandidate(pl);
                          setIsConfirmPlDeleteOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                        title="Xóa playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safety Confirm Modal for Playlist Deletion */}
      <ConfirmModal
        isOpen={isConfirmPlDeleteOpen}
        title={`Xóa Playlist "${deletePlCandidate?.title || ''}"`}
        message={`Bạn có chắc chắn muốn xóa playlist "${deletePlCandidate?.title}"? Hành động này sẽ loại bỏ danh sách phát này và không thể hoàn tác.`}
        confirmText="Xóa playlist"
        cancelText="Hủy bỏ"
        isDangerous={true}
        onConfirm={handleConfirmDeletePlaylist}
        onCancel={() => {
          setIsConfirmPlDeleteOpen(false);
          setDeletePlCandidate(null);
        }}
      />
    </div>
  );
};
