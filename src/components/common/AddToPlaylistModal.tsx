import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, Music, Search } from 'lucide-react';
import { Song, Playlist } from '../../types/music';
import { useMusicStore } from '../../store/useMusicStore';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  song: Song | null;
  onClose: () => void;
  onOpenCreatePlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  song,
  onClose,
  onOpenCreatePlaylist,
}) => {
  const { playlists, addSongToPlaylist, removeSongFromPlaylist } = useMusicStore();
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !song) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const filteredPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleTogglePlaylist = async (playlist: Playlist) => {
    const isInPlaylist = playlist.songIds.includes(song.id);
    if (isInPlaylist) {
      await removeSongFromPlaylist(playlist.id, song.id);
      showToast(`Đã xóa khỏi "${playlist.title}"`);
    } else {
      await addSongToPlaylist(playlist.id, song.id);
      showToast(`Đã thêm vào "${playlist.title}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Song info header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider font-mono">
              Thêm vào Playlist
            </span>
            <h3 className="text-sm font-bold text-white truncate leading-snug">{song.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] truncate">{song.artist}</p>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/40 text-center text-xs font-semibold text-[var(--accent)] animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Search Playlists */}
        {playlists.length > 3 && (
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Tìm playlist..."
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-xs text-white outline-none"
            />
          </div>
        )}

        {/* List of Playlists */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
              <Music className="w-8 h-8 opacity-30 mx-auto" />
              <p>Bạn chưa có playlist nào.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreatePlaylist();
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo playlist mới</span>
              </button>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-500">
              Không tìm thấy playlist phù hợp
            </div>
          ) : (
            filteredPlaylists.map((playlist) => {
              const inPlaylist = playlist.songIds.includes(song.id);
              return (
                <div
                  key={playlist.id}
                  onClick={() => handleTogglePlaylist(playlist)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    inPlaylist
                      ? 'bg-[var(--accent-light)] border-[var(--accent)]/50'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <img
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{playlist.title}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {playlist.songIds.length} bài hát
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      inPlaylist
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'border border-neutral-600 text-transparent hover:border-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action button to create a new playlist */}
        {playlists.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreatePlaylist();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer border border-white/5"
            >
              <Plus className="w-4 h-4 text-[var(--accent)]" />
              <span>Tạo playlist mới</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
