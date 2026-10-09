import React, { useState } from 'react';
import {
  TrendingUp,
  Play,
  Pause,
  Heart,
  FolderPlus,
} from 'lucide-react';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Song } from '../../types/music';

interface ChartRankViewProps {
  onOpenAddToPlaylist?: (song: Song) => void;
}

export const ChartRankView: React.FC<ChartRankViewProps> = ({ onOpenAddToPlaylist }) => {
  const { songs, favorites, toggleFavorite } = useMusicStore();
  const { currentSong, isPlaying, playSong, playPlaylist } = usePlayerStore();
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'vpop' | 'usuk' | 'kpop'>('all');

  // Filter & Rank songs
  const filteredSongs = songs
    .filter((s) => (selectedRegion === 'all' ? true : s.region === selectedRegion))
    .sort((a, b) => b.playsCount - a.playsCount);

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playPlaylist(filteredSongs, 0);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 tracking-tight">
              ITS Entertainment
            </h1>
            <button
              type="button"
              onClick={handlePlayAll}
              className="p-2 rounded-full bg-[var(--accent)] hover:opacity-90 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Phát tất cả bài hát trong ITS Entertainment"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
          </div>
        </div>

        {/* Region selector tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 self-start md:self-auto">
          {(
            [
              { id: 'all', label: 'TẤT CẢ' },
              { id: 'vpop', label: 'VIỆT NAM' },
              { id: 'usuk', label: 'US-UK' },
              { id: 'kpop', label: 'K-POP' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                selectedRegion === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Ranked Songs List */}
      {filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
          <TrendingUp className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-200">
            Chưa có bài hát trong bảng xếp hạng
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Chưa có ca khúc nào được phát hành. Hãy tải bài hát lên để bắt đầu xếp hạng ITS Entertainment!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSongs.map((song, index) => {
            const rank = index + 1;
            const isCurrent = currentSong?.id === song.id;
            const isFav = favorites.includes(song.id);

            const getRankStyle = (r: number) => {
              if (r === 1) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
              if (r === 2) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
              if (r === 3) return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
              return 'text-neutral-400 border-white/10 bg-white/5';
            };

            return (
              <div
                key={song.id}
                onClick={() => playSong(song, filteredSongs)}
                className={`group flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--accent-light)] border-[var(--accent)]/50 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                {/* Rank Number Badge */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 ${getRankStyle(
                    rank
                  )}`}
                >
                  {rank}
                </div>

                {/* Song Thumbnail */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 bg-white/10">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Song Info - Expanded title container with ~0.8rem font size */}
                <div className="flex-1 min-w-0 pr-2">
                  <h4
                    className={`text-[0.8rem] sm:text-sm font-bold leading-snug truncate ${
                      isCurrent ? 'text-[var(--accent)]' : 'text-white'
                    }`}
                  >
                    {song.title}
                  </h4>
                  <p className="text-[0.75rem] sm:text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-tight truncate">
                    {song.artist}
                  </p>
                </div>

                {/* Plays Count & Heart & Add to Playlist */}
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
                    className="p-1 sm:p-1.5 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                    title="Yêu thích"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isFav ? 'fill-pink-500 text-pink-500' : ''
                      }`}
                    />
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
  );
};
