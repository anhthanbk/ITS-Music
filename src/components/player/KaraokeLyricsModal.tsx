import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { X, Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';

export const KaraokeLyricsModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isKaraokeOpen,
    setKaraokeOpen,
    togglePlay,
    nextSong,
    prevSong,
    seek,
  } = usePlayerStore();

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyrics = currentSong?.lyrics || [];

  // Determine current active lyric index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth scroll active line into center of container
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isKaraokeOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      {/* Blurred background artwork */}
      <div
        className="absolute inset-0 opacity-25 filter blur-3xl pointer-events-none scale-120"
        style={{
          backgroundImage: `url(${currentSong.coverUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-white">
            <Music className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Lời bài hát & Karaoke
            </h2>
            <p className="text-xs text-neutral-400">
              {currentSong.title} — {currentSong.artist}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setKaraokeOpen(false)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Đóng chế độ lời bài hát"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Lyric Display */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 px-6 py-8 max-w-6xl mx-auto w-full overflow-hidden">
        {/* Left: Album cover spinning disc */}
        <div className="hidden md:flex md:col-span-4 flex-col items-center justify-center">
          <div className="relative group">
            <div
              className={`w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl ${
                isPlaying ? 'animate-spin-slow' : 'animation-paused'
              }`}
            >
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Center vinyl hole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/90 border-2 border-white/40 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[var(--accent)]" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {currentSong.title}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">{currentSong.artist}</p>
            {currentSong.album && (
              <p className="text-xs text-neutral-500 mt-0.5">Album: {currentSong.album}</p>
            )}
          </div>
        </div>

        {/* Right: Scrolling lyrics */}
        <div
          ref={containerRef}
          className="md:col-span-8 flex flex-col justify-start items-center overflow-y-auto px-4 py-16 scroll-smooth space-y-6 text-center select-none"
        >
          {lyrics.length > 0 ? (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPassed = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 py-1.5 px-4 rounded-xl ${
                    isActive
                      ? 'text-2xl md:text-3xl font-extrabold text-amber-300 scale-105 drop-shadow-[0_0_16px_rgba(252,211,77,0.5)]'
                      : isPassed
                      ? 'text-lg md:text-xl font-medium text-neutral-500 hover:text-neutral-300'
                      : 'text-lg md:text-xl font-medium text-neutral-400 hover:text-white'
                  }`}
                >
                  {line.text}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <p className="text-lg font-medium text-neutral-300">
                Lời bài hát đang được cập nhật cho ca khúc này
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                Hãy lắng nghe và hòa mình vào từng giai điệu ngọt ngào
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Mini Controller */}
      <div className="relative z-10 px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={prevSong}
          className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[var(--accent)] hover:opacity-90 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={nextSong}
          className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
};
