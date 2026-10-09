import React from 'react';
import { X, Play, Trash2, Plus, Music, Heart } from 'lucide-react';
import { Playlist, Song } from '../../types/music';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPlaylist?: (pl: Playlist) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onEditPlaylist,
}) => {
  const { playlists, songs, favorites, toggleFavorite, removeSongFromPlaylist, addSongToPlaylist } =
    useMusicStore();
  const { playPlaylist, playSong, currentSong } = usePlayerStore();

  if (!isOpen || !playlist) return null;

  // Use live playlist object from store if available
  const activePlaylist = playlists.find((p) => p.id === playlist.id) || playlist;

  const playlistSongs: Song[] = activePlaylist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  // Available songs that can be added to playlist
  const availableToAdd = songs.filter((s) => !activePlaylist.songIds.includes(s.id));

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playPlaylist(playlistSongs, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 sm:p-6 md:p-8 shadow-2xl relative my-4 sm:my-8 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-neutral-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer z-10 bg-black/40 sm:bg-transparent"
          aria-label="Đóng"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Playlist Header Hero */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-[var(--border-subtle)] shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
            <img
              src={activePlaylist.coverUrl}
              alt={activePlaylist.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              PLAYLIST
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5 truncate">
              {activePlaylist.title}
            </h2>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed line-clamp-2">
              {activePlaylist.description || 'Tuyển tập những bài hát được tuyển chọn đặc sắc.'}
            </p>

            <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                <span>Phát tất cả ({playlistSongs.length} bài)</span>
              </button>

              {onEditPlaylist && (
                <button
                  type="button"
                  onClick={() => onEditPlaylist(activePlaylist)}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Songs in Playlist */}
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Danh sách bài hát ({playlistSongs.length})
            </h3>
          </div>

          {playlistSongs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
              <Music className="w-7 h-7 sm:w-8 sm:h-8 opacity-40 mx-auto mb-2" />
              <p className="text-xs font-semibold">Playlist này chưa có bài hát nào</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Hãy thêm bài hát từ danh sách gợi ý bên dưới
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 sm:max-h-72 overflow-y-auto pr-1">
              {playlistSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const isFav = favorites.includes(song.id);

                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, playlistSongs)}
                    className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--accent-light)] border border-[var(--accent)]/40'
                        : 'hover:bg-white/5 bg-white/3 sm:bg-transparent'
                    }`}
                  >
                    <span className="text-xs font-mono text-neutral-500 w-4 sm:w-5 text-center shrink-0">
                      {idx + 1}
                    </span>

                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-[0.8rem] sm:text-sm font-bold text-white truncate group-hover:text-[var(--accent)] leading-snug">
                        {song.title}
                      </h4>
                      <p className="text-[0.7rem] sm:text-xs text-[var(--text-secondary)] truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                      <span className="text-xs font-mono font-bold tabular-nums text-amber-300 sm:text-neutral-200 mr-0.5">
                        {song.playsCount.toLocaleString('vi-VN')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                        className="p-1 sm:p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Yêu thích"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSongFromPlaylist(activePlaylist.id, song.id);
                        }}
                        className="p-1 sm:p-1.5 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Xóa khỏi playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Add songs into Playlist */}
          {availableToAdd.length > 0 && (
            <div className="mt-4 pt-3 sm:pt-4 border-t border-[var(--border-subtle)]">
              <h4 className="text-xs font-bold text-neutral-300 mb-2">
                Gợi ý thêm bài hát vào playlist:
              </h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-28 sm:max-h-36 overflow-y-auto">
                {availableToAdd.slice(0, 8).map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => addSongToPlaylist(activePlaylist.id, song.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[var(--accent)] text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{song.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
