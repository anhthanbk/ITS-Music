import React, { useState } from 'react';
import {
  Heart,
  ListMusic,
  Play,
  Plus,
  Trash2,
  FolderHeart,
  Music,
  FolderPlus,
  ShieldCheck,
  Pencil,
  Search,
  Upload,
} from 'lucide-react';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Playlist, Song } from '../../types/music';
import { ConfirmModal } from '../common/ConfirmModal';
import { ScrollingText } from '../common/ScrollingText';

interface LibraryViewProps {
  onOpenCreatePlaylist: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenAddToPlaylist?: (song: Song) => void;
  onOpenEditSong?: (song: Song) => void;
  onOpenUploadSong?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenCreatePlaylist,
  onSelectPlaylist,
  onOpenAddToPlaylist,
  onOpenEditSong,
  onOpenUploadSong,
}) => {
  const { user } = useAuthStore();
  const { songs, playlists, favorites, toggleFavorite, deletePlaylist, deleteSong } =
    useMusicStore();
  const { playSong, playPlaylist, currentSong, isPlaying } = usePlayerStore();

  const isAdmin = Boolean(user && user.role === 'admin');

  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists' | 'admin'>('favorites');
  const [deletePlCandidate, setDeletePlCandidate] = useState<Playlist | null>(null);
  const [isConfirmPlDeleteOpen, setIsConfirmPlDeleteOpen] = useState(false);

  // Admin song management state
  const [adminSearch, setAdminSearch] = useState('');
  const [deleteSongCandidate, setDeleteSongCandidate] = useState<Song | null>(null);
  const [isConfirmSongDeleteOpen, setIsConfirmSongDeleteOpen] = useState(false);

  const favoriteSongs = songs.filter((s) => favorites.includes(s.id));

  const adminFilteredSongs = songs.filter((s) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)
    );
  });

  const handlePlayAllFavorites = () => {
    if (favoriteSongs.length > 0) {
      playPlaylist(favoriteSongs, 0);
    }
  };

  const handleConfirmDeletePlaylist = async () => {
    if (deletePlCandidate) {
      await deletePlaylist(deletePlCandidate.id);
      setDeletePlCandidate(null);
      setIsConfirmPlDeleteOpen(false);
    }
  };

  const handleConfirmDeleteSong = async () => {
    if (deleteSongCandidate) {
      await deleteSong(deleteSongCandidate.id);
      setDeleteSongCandidate(null);
      setIsConfirmSongDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderHeart className="w-6 h-6 text-pink-400" />
            Thư viện
          </h1>

          {onOpenUploadSong && (
            <button
              type="button"
              onClick={onOpenUploadSong}
              className="p-2 sm:p-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white shadow-md transition-all cursor-pointer"
              title="Tải bài hát mới"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher - 1 Single Row Grid */}
        <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 w-full`}>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-colors cursor-pointer truncate ${
              activeTab === 'favorites'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="truncate">Yêu thích ({favoriteSongs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-colors cursor-pointer truncate ${
              activeTab === 'playlists'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Playlist ({playlists.length})</span>
          </button>

          {/* Admin tab exclusively for Admin user */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer truncate ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">Admin ({songs.length})</span>
            </button>
          )}
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

                    <div className="flex-1 min-w-0 pr-2">
                      <ScrollingText
                        text={song.title}
                        className={`text-[0.8rem] sm:text-sm font-bold leading-snug ${
                          isCurrent ? 'text-[var(--accent)]' : 'text-white'
                        }`}
                      />
                      <p className="text-[0.75rem] sm:text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-tight truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                      <span className="text-xs font-mono font-bold tabular-nums text-amber-300 sm:text-neutral-200 mr-1">
                        {song.playsCount.toLocaleString('vi-VN')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                        className="p-1 sm:p-1.5 text-pink-500 hover:text-neutral-400 rounded-full transition-colors cursor-pointer shrink-0"
                        title="Bỏ thích"
                      >
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-pink-500" />
                      </button>
                      {onOpenAddToPlaylist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAddToPlaylist(song);
                          }}
                          className="p-1 sm:p-1.5 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                          title="Thêm vào playlist"
                        >
                          <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
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

      {/* 4. ADMIN TAB (Exclusively for Admin users) */}
      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-4">
          {/* Admin Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Tìm kiếm bài hát theo tên, ca sĩ hoặc thể loại..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-[var(--accent)] rounded-xl text-xs text-white outline-none"
            />
          </div>

          {/* All Songs List for Admin */}
          {adminFilteredSongs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
              <Music className="w-10 h-10 opacity-30 mx-auto mb-3" />
              <p className="text-xs font-semibold">Không tìm thấy bài hát nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {adminFilteredSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-[var(--accent-light)] border-[var(--accent)]/50'
                        : 'bg-white/5 hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <div
                      onClick={() => playSong(song, adminFilteredSongs)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="text-xs font-mono text-neutral-500 w-6 text-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white/10">
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <ScrollingText
                          text={song.title}
                          className="text-[0.8rem] sm:text-sm font-bold text-white"
                        />
                        <div className="flex items-center gap-2 text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
                          <span className="truncate">{song.artist}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono text-purple-300">
                            {song.genre}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-300 mr-2">
                        {song.playsCount.toLocaleString('vi-VN')} nghe
                      </span>

                      {onOpenEditSong && (
                        <button
                          type="button"
                          onClick={() => onOpenEditSong(song)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
                          title="Chỉnh sửa bài hát"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteSongCandidate(song);
                          setIsConfirmSongDeleteOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
                        title="Xóa bài hát khỏi Supabase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {/* Safety Confirm Modal for Song Deletion by Admin */}
      <ConfirmModal
        isOpen={isConfirmSongDeleteOpen}
        title={`Xóa bài hát "${deleteSongCandidate?.title || ''}"`}
        message={`Bạn có chắc chắn muốn xóa bài hát "${deleteSongCandidate?.title}" của ca sĩ "${deleteSongCandidate?.artist}" khỏi hệ thống Supabase? Hành động này sẽ xóa dữ liệu trên Database và Storage.`}
        confirmText="Xóa bài hát"
        cancelText="Hủy bỏ"
        isDangerous={true}
        onConfirm={handleConfirmDeleteSong}
        onCancel={() => {
          setIsConfirmSongDeleteOpen(false);
          setDeleteSongCandidate(null);
        }}
      />
    </div>
  );
};
