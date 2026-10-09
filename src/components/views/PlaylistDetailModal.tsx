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
  const { songs, favorites, toggleFavorite, removeSongFromPlaylist, addSongToPlaylist } =
    useMusicStore();
  const { playPlaylist, playSong, currentSong } = usePlayerStore();

  if (!isOpen || !playlist) return null;

  const playlistSongs: Song[] = playlist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  // Available songs that can be added to playlist
  const availableToAdd = songs.filter((s) => !playlist.songIds.includes(s.id));

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playPlaylist(playlistSongs, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 md:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Playlist Header Hero */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[var(--border-subtle)]">
          <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              PLAYLIST
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              {playlist.title}
            </h2>
            <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
              {playlist.description || 'Tuyển tập những bài hát được tuyển chọn đặc sắc.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Phát tất cả ({playlistSongs.length} bài)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Songs in Playlist */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Danh sách bài hát ({playlistSongs.length})
            </h3>
          </div>

          {playlistSongs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
              <Music className="w-8 h-8 opacity-40 mx-auto mb-2" />
              <p className="text-xs font-semibold">Playlist này chưa có bài hát nào</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Hãy thêm bài hát từ danh sách gợi ý bên dưới
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {playlistSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const isFav = favorites.includes(song.id);

                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, playlistSongs)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--accent-light)] border border-[var(--accent)]/40'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-mono text-neutral-500 w-5 text-center">
                      {idx + 1}
                    </span>

                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-[var(--accent)]">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">
                        {song.artist}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromPlaylist(playlist.id, song.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Xóa khỏi playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Add songs into Playlist */}
          {availableToAdd.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <h4 className="text-xs font-bold text-neutral-300 mb-2">
                Gợi ý thêm bài hát vào playlist:
              </h4>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {availableToAdd.slice(0, 8).map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => addSongToPlaylist(playlist.id, song.id)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[var(--accent)] text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{song.title}</span>
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
