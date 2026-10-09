import React, { useState } from 'react';
import { Radio, Filter, Play, Heart, Sparkles, Disc, FolderPlus } from 'lucide-react';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Song } from '../../types/music';
import { ScrollingText } from '../common/ScrollingText';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', color: 'from-purple-600 to-indigo-600' },
  { id: 'V-Pop', name: 'V-Pop Thịnh Hành', color: 'from-pink-600 to-rose-600' },
  { id: 'Ballad', name: 'Ballad Trữ Tình', color: 'from-amber-600 to-orange-600' },
  { id: 'Lofi', name: 'Lofi & Chillout', color: 'from-blue-600 to-cyan-600' },
  { id: 'EDM', name: 'EDM Sôi Động', color: 'from-violet-600 to-purple-800' },
  { id: 'Acoustic', name: 'Acoustic Mộc', color: 'from-emerald-600 to-teal-700' },
  { id: 'Remix', name: 'Remix Cực Căng', color: 'from-red-600 to-pink-700' },
  { id: 'Indie', name: 'Indie Việt', color: 'from-sky-600 to-blue-700' },
];

interface GenresViewProps {
  onOpenAddToPlaylist?: (song: Song) => void;
}

export const GenresView: React.FC<GenresViewProps> = ({ onOpenAddToPlaylist }) => {
  const { songs, favorites, toggleFavorite } = useMusicStore();
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'vpop' | 'usuk' | 'kpop'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'title'>('popular');

  // Filter & sort
  let filtered = songs.filter((s) => {
    const matchGenre = selectedGenre === 'all' || s.genre === selectedGenre;
    const matchRegion = selectedRegion === 'all' || s.region === selectedRegion;
    return matchGenre && matchRegion;
  });

  if (sortBy === 'popular') {
    filtered.sort((a, b) => b.playsCount - a.playsCount);
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-purple-400" />
          Thể Loại & Chủ Đề Âm Nhạc
        </h1>
      </div>

      {/* 2. Genre Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedGenre === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedGenre(cat.id)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} text-left relative overflow-hidden transition-all cursor-pointer shadow-md ${
                isSelected
                  ? 'ring-3 ring-white scale-102 font-bold shadow-xl'
                  : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
              }`}
            >
              <div className="relative z-10">
                <span className="text-xs uppercase tracking-wider text-white/80 font-mono block">
                  Thể loại
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{cat.name}</h3>
              </div>
              <Disc className="w-16 h-16 text-white/10 absolute -right-3 -bottom-3 pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* 3. Filter Bar (2 Dropdown Selects on 1 Row) */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0 hidden xs:block" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as 'all' | 'vpop' | 'usuk' | 'kpop')}
            className="w-full px-3 py-2 text-xs font-semibold bg-black/40 border border-white/10 rounded-xl text-white outline-none cursor-pointer focus:border-[var(--accent)] truncate"
          >
            <option value="all">Tất cả khu vực</option>
            <option value="vpop">Việt Nam</option>
            <option value="usuk">US-UK</option>
            <option value="kpop">K-Pop</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'title')}
            className="w-full px-3 py-2 text-xs font-semibold bg-black/40 border border-white/10 rounded-xl text-white outline-none cursor-pointer focus:border-[var(--accent)] truncate"
          >
            <option value="popular">Lượt nghe nhiều nhất</option>
            <option value="newest">Mới cập nhật</option>
            <option value="title">Tên bài hát (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 4. Filtered Songs Grid */}
      <div className="space-y-2">
        <div className="text-xs text-neutral-400 mb-2">
          Tìm thấy <span className="text-white font-bold">{filtered.length}</span> bài hát phù hợp
        </div>

        {filtered.map((song, idx) => {
          const isCurrent = currentSong?.id === song.id;
          const isFav = favorites.includes(song.id);

          return (
            <div
              key={song.id}
              onClick={() => playSong(song, filtered)}
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
                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
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
    </div>
  );
};
