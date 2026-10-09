import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { X, Trash2, Play, Music, Sparkles } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    queueIndex,
    currentSong,
    isPlaying,
    isQueueOpen,
    setQueueOpen,
    playSong,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-22 z-40 w-80 md:w-96 bg-[var(--bg-card)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-tight">Danh sách phát</h3>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            ({queue.length} bài)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Xóa danh sách"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setQueueOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-400">
            <Music className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-xs font-medium">Chưa có bài hát nào trong hàng đợi</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Khám phá và chọn bài hát yêu thích để nghe
            </p>
          </div>
        ) : (
          queue.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={`${song.id}-${idx}`}
                className={`group flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--accent-light)] border border-[var(--accent)]/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <div
                  className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0"
                  onClick={() => playSong(song, queue)}
                >
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-full bg-white animate-pulse" />
                          <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-3.5 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="flex-1 min-w-0"
                  onClick={() => playSong(song, queue)}
                >
                  <h4
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-[var(--accent)]' : 'text-white'
                    }`}
                  >
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
                    removeFromQueue(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity cursor-pointer"
                  title="Xóa khỏi hàng đợi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-black/20 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          Tự động phát bài hát tiếp theo
        </span>
        <span className="font-mono">{queueIndex + 1}/{queue.length}</span>
      </div>
    </div>
  );
};
