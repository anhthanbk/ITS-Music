import React, { useState } from 'react';
import {
  TrendingUp,
  Play,
  Pause,
  Heart,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { HOURLY_CHART_DATA } from '../../data/initialPlaylists';
import { Song } from '../../types/music';

export const ChartRankView: React.FC = () => {
  const { songs, favorites, toggleFavorite } = useMusicStore();
  const { currentSong, isPlaying, playSong, playPlaylist, togglePlay } = usePlayerStore();
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'vpop' | 'usuk' | 'kpop'>('all');

  // Filter & Rank songs
  const filteredSongs = songs
    .filter((s) => (selectedRegion === 'all' ? true : s.region === selectedRegion))
    .sort((a, b) => b.playsCount - a.playsCount);

  const top3 = filteredSongs.slice(0, 3);

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playPlaylist(filteredSongs, 0);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 tracking-tight">
              #itsChart
            </h1>
            <button
              type="button"
              onClick={handlePlayAll}
              className="p-2 rounded-full bg-[var(--accent)] hover:opacity-90 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Phát tất cả bài hát trong bảng xếp hạng"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
          </div>
          <p className="text-xs text-neutral-300 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            Bảng xếp hạng âm nhạc thời gian thực · Cập nhật liên tục 24/7
          </p>
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
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
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

      {/* 2. Interactive Recharts Line Graph for Top 3 */}
      {top3.length > 0 && (
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#1a102c] via-[#23173d] to-black/80 border border-purple-500/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Xu Hướng Lượt Nghe 24 Giờ Qua</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                1. {top3[0]?.title || 'Top 1'}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                2. {top3[1]?.title || 'Top 2'}
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                3. {top3[2]?.title || 'Top 3'}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HOURLY_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b1227',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="song1Listens"
                  name={top3[0]?.title || 'Top 1'}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="song2Listens"
                  name={top3[1]?.title || 'Top 2'}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="song3Listens"
                  name={top3[2]?.title || 'Top 3'}
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Ranked Songs List (Zing MP3 Top 20) */}
      {filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
          <TrendingUp className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-200">
            Chưa có bài hát trong bảng xếp hạng
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Chưa có ca khúc nào được phát hành. Hãy tải bài hát lên để bắt đầu xếp hạng #itsChart!
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
              className={`group flex items-center gap-3 md:gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[var(--accent-light)] border-[var(--accent)]/50 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 border-white/5'
              }`}
            >
              {/* Rank Number Badge */}
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-black text-base shrink-0 ${getRankStyle(
                  rank
                )}`}
              >
                {rank}
              </div>

              {/* Rank Change Indicator */}
              <div className="w-5 flex items-center justify-center shrink-0">
                {song.rankChange === 'up' ? (
                  <span className="flex items-center text-[10px] text-emerald-400 font-bold" title="Tăng hạng">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </span>
                ) : song.rankChange === 'down' ? (
                  <span className="flex items-center text-[10px] text-red-400 font-bold" title="Giảm hạng">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-neutral-500" title="Giữ nguyên vị trí">
                    <Minus className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Song Thumbnail */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {isCurrent && isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  )}
                </div>
              </div>

              {/* Song Info */}
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

              {/* Album / Genre */}
              <div className="hidden md:block w-36 truncate text-xs text-neutral-400">
                {song.genre} · {song.album || 'Đĩa Đơn'}
              </div>

              {/* Plays Count */}
              <div className="text-right w-24 shrink-0">
                <span className="text-xs font-mono tabular-nums text-neutral-300">
                  {song.playsCount.toLocaleString('vi-VN')}
                </span>
                <p className="text-[10px] text-neutral-500">lượt nghe</p>
              </div>

              {/* Duration */}
              <span className="hidden sm:inline text-xs font-mono tabular-nums text-neutral-400 w-12 text-right">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
              </span>

              {/* Actions */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(song.id);
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFav ? 'fill-pink-500 text-pink-500' : ''
                  }`}
                />
              </button>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
