import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  TrendingUp,
  Flame,
  Sparkles,
  ChevronRight,
  Headphones,
  Heart,
  Plus,
  Music2,
  ListMusic,
  Upload,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { generateRealChartData } from '../../lib/chartUtils';
import { Song, Playlist } from '../../types/music';

interface DiscoverViewProps {
  onNavigateToChart: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenUploadSong?: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onNavigateToChart,
  onSelectPlaylist,
  onOpenUploadSong,
}) => {
  const { songs, playlists, favorites, toggleFavorite } = useMusicStore();
  const { currentSong, isPlaying, playSong, togglePlay, playPlaylist } = usePlayerStore();

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'vpop' | 'usuk' | 'kpop'>('all');

  // Dynamically generate banners from real Supabase songs if available
  const heroBanners =
    songs.length > 0
      ? songs.slice(0, 3).map((song, idx) => ({
          id: song.id,
          title: song.title,
          subtitle: `${song.artist}${song.album ? ` · ${song.album}` : ''}`,
          tag: idx === 0 ? 'TOP 1 XU HƯỚNG' : idx === 1 ? 'THỊNH HÀNH' : 'ĐỀ XUẤT',
          color:
            idx === 0
              ? 'from-purple-900/90 via-indigo-900/60 to-black/80'
              : idx === 1
              ? 'from-blue-900/90 via-slate-900/60 to-black/80'
              : 'from-rose-900/90 via-purple-900/60 to-black/80',
          img: song.coverUrl,
          song,
        }))
      : [
          {
            id: 'banner-1',
            title: 'Khám Phá Âm Nhạc Cùng ITS Music',
            subtitle: 'Kho nhạc trực tuyến chất lượng cao với âm thanh sống động và trải nghiệm mượt mà',
            tag: 'THỊNH HÀNH',
            color: 'from-purple-900/90 via-indigo-900/60 to-black/80',
            img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
            song: null,
          },
          {
            id: 'banner-2',
            title: 'Âm Thanh Lossless & Lời Bài Hát',
            subtitle: 'Tải lên các ca khúc yêu thích của bạn và đồng bộ chế độ Karaoke từng giây',
            tag: 'TÍNH NĂNG',
            color: 'from-blue-900/90 via-slate-900/60 to-black/80',
            img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
            song: null,
          },
          {
            id: 'banner-3',
            title: 'Bảng Xếp Hạng #itsChart Realtime',
            subtitle: 'Lắng nghe những giai điệu bùng nổ và tự động ghi nhận lượt streams thực tế',
            tag: 'CHART REALTIME',
            color: 'from-rose-900/90 via-purple-900/60 to-black/80',
            img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
            song: null,
          },
        ];

  // Auto rotate banners
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const top3Songs = songs.slice(0, 3);

  const filteredReleases = songs.filter((s) => {
    if (releaseFilter === 'all') return true;
    return s.region === releaseFilter;
  });

  const handlePlayBanner = (bannerItem: (typeof heroBanners)[0]) => {
    if (bannerItem.song) {
      if (currentSong?.id === bannerItem.song.id) {
        togglePlay();
      } else {
        playSong(bannerItem.song, songs);
      }
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 1. HERO CAROUSEL BANNERS (Zing MP3 Style) */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroBanners.map((banner, idx) => {
            const isFeatured = idx === activeBannerIndex;
            return (
              <div
                key={banner.id}
                onClick={() => handlePlayBanner(banner)}
                className={`relative rounded-2xl overflow-hidden h-52 transition-all duration-300 cursor-pointer group shadow-xl border ${
                  isFeatured
                    ? 'border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/30 scale-[1.01]'
                    : 'border-white/10 opacity-85 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <img
                  src={banner.img}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${banner.color} p-5 flex flex-col justify-between`}
                >
                  <span className="inline-block self-start text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                    {banner.tag}
                  </span>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-sm line-clamp-1">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-neutral-200 mt-1 line-clamp-2">
                      {banner.subtitle}
                    </p>

                    {banner.song && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                        <span className="text-xs font-semibold text-white">Phát ngay</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {heroBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveBannerIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeBannerIndex ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. #itsChart REALTIME PREVIEW (Zing MP3 #zingchart style) */}
      <section className="rounded-3xl p-6 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-black/80 border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
                  #itsChart Realtime
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold animate-pulse">
                  TRỰC TIẾP
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Bảng xếp hạng ca khúc được nghe nhiều nhất theo giờ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToChart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Xem đầy đủ Top 20</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {top3Songs.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-black/20 border border-white/5 text-neutral-400">
            <TrendingUp className="w-10 h-10 text-[var(--accent)] opacity-40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Chưa có bài hát trong bảng xếp hạng</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Chưa có bài hát nào trên hệ thống. Hãy tải lên các ca khúc đầu tiên để bắt đầu ghi nhận bảng xếp hạng #itsChart!
            </p>
            {onOpenUploadSong && (
              <button
                type="button"
                onClick={onOpenUploadSong}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải lên bài hát đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Top 3 Songs List */}
            <div className="lg:col-span-5 space-y-3">
              {top3Songs.map((song, index) => {
                const rank = index + 1;
                const isCurrent = currentSong?.id === song.id;
                const isFav = favorites.includes(song.id);

                const rankBorderColor =
                  rank === 1
                    ? 'border-blue-500 shadow-blue-500/20'
                    : rank === 2
                    ? 'border-emerald-500 shadow-emerald-500/20'
                    : 'border-rose-500 shadow-rose-500/20';

                const rankTextColor =
                  rank === 1
                    ? 'text-blue-400'
                    : rank === 2
                    ? 'text-emerald-400'
                    : 'text-rose-400';

                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, songs)}
                    className={`group flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border ${rankBorderColor} shadow-md transition-all cursor-pointer`}
                  >
                    <span className={`text-2xl font-black font-mono w-7 text-center ${rankTextColor}`}>
                      {rank}
                    </span>

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

                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-[0.8rem] font-bold text-white truncate group-hover:text-[var(--accent)]">
                        {song.title}
                      </h4>
                      <p className="text-[0.75rem] text-neutral-400 truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <span className="text-xs font-mono font-bold tabular-nums text-amber-300">
                        {song.playsCount.toLocaleString('vi-VN')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isFav ? 'fill-pink-500 text-pink-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Interactive Recharts Mini Chart */}
            <div className="lg:col-span-7 h-56 bg-black/30 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-2 px-2 text-[11px]">
                <span className="text-neutral-400 font-mono">Biểu đồ lượt nghe hôm nay</span>
                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Top 1
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Top 2
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Top 3
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={generateRealChartData(top3Songs, isPlaying ? currentSong?.id : undefined)}>
                  <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f162b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    itemStyle={{ padding: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="song1Listens"
                    name={top3Songs[0]?.title || 'Top 1'}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="song2Listens"
                    name={top3Songs[1]?.title || 'Top 2'}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="song3Listens"
                    name={top3Songs[2]?.title || 'Top 3'}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* 3. MỚI PHÁT HÀNH (NEW RELEASES GRID) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Mới Phát Hành</h2>
          </div>

          {/* Region filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl self-start">
            {(
              [
                { id: 'all', label: 'TẤT CẢ' },
                { id: 'vpop', label: 'VIỆT NAM' },
                { id: 'usuk', label: 'QUỐC TẾ' },
                { id: 'kpop', label: 'HÀN QUỐC' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReleaseFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  releaseFilter === f.id
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReleases.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
            <Music2 className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Chưa có bài hát mới phát hành</p>
            <p className="text-xs text-neutral-500 mt-1">
              Hãy tải lên bài hát đầu tiên lên Supabase Storage để xuất hiện tại đây
            </p>
            {onOpenUploadSong && (
              <button
                type="button"
                onClick={onOpenUploadSong}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải lên bài hát</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {filteredReleases.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              const isFav = favorites.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, songs)}
                  className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-[var(--accent-light)] border-[var(--accent)]/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0">
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

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[var(--accent)]">
                      {song.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] truncate">
                      {song.artist}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] text-neutral-400">
                      <span className="px-1 py-0.2 rounded bg-white/10 text-neutral-300 truncate max-w-[60px] sm:max-w-none">
                        {song.genre}
                      </span>
                      <span className="hidden xs:inline">·</span>
                      <span className="font-mono tabular-nums hidden xs:inline">
                        {song.playsCount.toLocaleString('vi-VN')} views
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    className="p-1 sm:p-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isFav ? 'fill-pink-500 text-pink-500' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PLAYLISTS NỔI BẬT */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Playlist Tuyển Chọn Cho Bạn
            </h2>
          </div>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-neutral-400">
            <ListMusic className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Chưa có playlist nào trên hệ thống</p>
            <p className="text-xs text-neutral-500 mt-1">
              Bạn có thể tạo tuyển tập playlist cá nhân của riêng mình trong mục Thư viện
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white truncate group-hover:text-[var(--accent)]">
                  {pl.title}
                </h4>
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                  {pl.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
