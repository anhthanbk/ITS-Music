import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Heart,
  Settings2,
  Waves,
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useMusicStore } from '../../store/useMusicStore';
import { AudioQuality } from '../../types/music';
import { AudioVisualizer } from '../common/AudioVisualizer';

export const AudioPlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    audioQuality,
    isKaraokeOpen,
    isQueueOpen,
    togglePlay,
    nextSong,
    prevSong,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setAudioQuality,
    setKaraokeOpen,
    setQueueOpen,
  } = usePlayerStore();

  const { favorites, toggleFavorite } = useMusicStore();
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showVisualizerBar, setShowVisualizerBar] = useState(false);

  const isFav = currentSong ? favorites.includes(currentSong.id) : false;
  const songDuration = duration || currentSong?.duration || 180;
  const progressPercent = songDuration > 0 ? (currentTime / songDuration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-player)] border-t border-[var(--border-subtle)] backdrop-blur-md">
      {/* Expanded Equalizer Popup Dock */}
      {showVisualizerBar && currentSong && (
        <div className="px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">Equalizer - Tần số âm thanh</span>
            </div>
            <div className="flex-1 max-w-xl mx-4">
              <AudioVisualizer variant="bars" barCount={32} height={44} colorTheme="neon" showPeaks={true} />
            </div>
            <button
              type="button"
              onClick={() => setShowVisualizerBar(false)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className="h-22 px-4 md:px-6 flex items-center justify-between">
        {/* 1. LEFT ZONE: Current Song Info & Spinning Disc */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-[320px]">
          {currentSong ? (
            <>
              <div className="relative group shrink-0">
                <div
                  className={`w-13 h-13 rounded-full overflow-hidden border-2 border-white/20 shadow-lg ${
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--bg-player)] border border-white/30" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-white truncate hover:text-[var(--accent)] cursor-pointer transition-colors">
                    {currentSong.title}
                  </h4>
                  {isPlaying && (
                    <AudioVisualizer variant="mini" barCount={4} height={12} colorTheme="neon" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {currentSong.artist}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(currentSong.id)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                title={isFav ? 'Bỏ thích' : 'Yêu thích'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFav ? 'fill-pink-500 text-pink-500' : 'text-neutral-400'
                  }`}
                />
              </button>
            </>
        ) : (
          <div className="flex items-center gap-3 text-neutral-400">
            <div className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Play className="w-5 h-5 opacity-40" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-300">ITS Music sẵn sàng</p>
              <p className="text-[11px] text-neutral-500">Chọn bài hát để phát</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. CENTER ZONE: Main Controls & Timeline Slider */}
      <div className="flex-1 max-w-2xl px-4 flex flex-col items-center justify-center">
        {/* Button controls */}
        <div className="flex items-center gap-4 md:gap-6 mb-1.5">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isShuffled
                ? 'text-[var(--accent)] bg-[var(--accent-light)]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Bật/Tắt phát ngẫu nhiên"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={prevSong}
            disabled={!currentSong}
            className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="Bài trước đó"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-10 h-10 rounded-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
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
            disabled={!currentSong}
            className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-[var(--accent)] bg-[var(--accent-light)]'
                : 'text-neutral-400 hover:text-white'
            }`}
            title={`Chế độ lặp lại: ${repeatMode === 'off' ? 'Tắt' : repeatMode === 'all' ? 'Lặp tất cả' : 'Lặp 1 bài'}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Timeline seeker */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono tabular-nums text-neutral-400 w-9 text-right">
            {formatSeconds(currentTime)}
          </span>

          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min={0}
              max={songDuration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              disabled={!currentSong}
              aria-label="Tiến độ bài hát"
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
              style={{
                background: `linear-gradient(to right, var(--accent) ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
              }}
            />
          </div>

          <span className="text-[11px] font-mono tabular-nums text-neutral-400 w-9">
            {formatSeconds(songDuration)}
          </span>
        </div>
      </div>

      {/* 3. RIGHT ZONE: Karaoke, Quality, Volume, Queue */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px] max-w-[320px]">
        {/* Audio Quality Badge Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="px-2 py-0.5 rounded text-[10px] font-bold border border-white/20 hover:border-[var(--accent)] text-neutral-300 hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer"
            title="Chất lượng âm thanh"
          >
            {audioQuality}
            <Settings2 className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showQualityMenu && (
            <div className="absolute bottom-8 right-0 w-36 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-1.5 shadow-xl text-xs z-50">
              {(['128kbps', '320kbps', 'lossless'] as AudioQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAudioQuality(q);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    audioQuality === q
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <span className="uppercase">{q}</span>
                  {q === 'lossless' && (
                    <span className="text-[9px] px-1 py-0.2 bg-purple-500 text-white font-bold rounded">
                      HQ
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visualizer / Equalizer Button */}
        <button
          type="button"
          onClick={() => setShowVisualizerBar(!showVisualizerBar)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            showVisualizerBar
              ? 'bg-amber-400 text-black font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bật/tắt thanh sóng nhạc Equalizer"
        >
          <Waves className="w-4 h-4" />
        </button>

        {/* Karaoke / Lyrics */}
        <button
          type="button"
          onClick={() => setKaraokeOpen(!isKaraokeOpen)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isKaraokeOpen
              ? 'bg-[var(--accent)] text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Xem lời bài hát / Karaoke"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Âm lượng"
            className="w-18 md:w-22 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--accent) ${
                (isMuted ? 0 : volume) * 100
              }%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
            }}
          />
        </div>

        {/* Queue Drawer toggle */}
        <button
          type="button"
          onClick={() => setQueueOpen(!isQueueOpen)}
          className={`p-2 rounded-xl border border-transparent transition-colors cursor-pointer ${
            isQueueOpen
              ? 'bg-white/15 text-white border-white/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Danh sách phát hiện tại"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
  );
};

function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
