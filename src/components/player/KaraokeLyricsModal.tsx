import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useMusicStore } from '../../store/useMusicStore';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Mic2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  Disc3,
  FileText,
  Edit3,
  Save,
} from 'lucide-react';
import { LyricLine } from '../../types/music';

type ViewMode = 'karaoke' | 'scrolling';

export const KaraokeLyricsModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isKaraokeOpen,
    setKaraokeOpen,
    togglePlay,
    nextSong,
    prevSong,
    seek,
    setVolume,
    toggleMute,
    updateCurrentSong,
  } = usePlayerStore();

  const { updateSong } = useMusicStore();

  const [viewMode, setViewMode] = useState<ViewMode>('karaoke');
  const [fontSizeClass, setFontSizeClass] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manual Lyrics Editing State
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [manualLrcInput, setManualLrcInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyrics = currentSong?.lyrics || [];
  const songDuration = duration || currentSong?.duration || 180;
  const progressPercent = songDuration > 0 ? (currentTime / songDuration) * 100 : 0;

  // Determine current active lyric index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const currentLyric = activeIndex >= 0 ? lyrics[activeIndex] : null;
  const nextLyric = activeIndex + 1 < lyrics.length ? lyrics[activeIndex + 1] : null;

  // Calculate timing progress between current lyric and next lyric
  let lineProgressRatio = 0;
  if (currentLyric) {
    const nextTime = nextLyric ? nextLyric.time : currentLyric.time + 6;
    const lineDuration = Math.max(1, nextTime - currentLyric.time);
    lineProgressRatio = Math.min(1, Math.max(0, (currentTime - currentLyric.time) / lineDuration));
  }

  // Smooth scroll active line into center of container in Scrolling mode
  useEffect(() => {
    if (viewMode === 'scrolling' && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, viewMode]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKaraokeOpen) return;
      if (e.key === 'Escape') {
        setKaraokeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKaraokeOpen, setKaraokeOpen]);

  // Sync manual input when editing modal opens
  const openManualEditor = () => {
    if (lyrics && lyrics.length > 0) {
      const formatted = lyrics
        .map((l) => {
          const m = Math.floor(l.time / 60).toString().padStart(2, '0');
          const s = Math.floor(l.time % 60).toString().padStart(2, '0');
          return `[${m}:${s}] ${l.text}`;
        })
        .join('\n');
      setManualLrcInput(formatted);
    } else {
      setManualLrcInput('');
    }
    setIsEditingLyrics(true);
  };

  const parseManualLrc = (raw: string): LyricLine[] => {
    if (!raw || !raw.trim()) return [];
    const lines = raw.split('\n');
    const result: LyricLine[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
        const totalSeconds = minutes * 60 + seconds + millis / 1000;
        const text = match[4].trim();
        if (text) result.push({ time: totalSeconds, text });
      } else {
        result.push({ time: result.length * 5, text: trimmed });
      }
    }
    return result.sort((a, b) => a.time - b.time);
  };

  const handleSaveManualLyrics = async () => {
    if (!currentSong) return;
    const parsed = parseManualLrc(manualLrcInput);

    // Update local state
    const updated = { ...currentSong, lyrics: parsed };
    updateCurrentSong(updated);

    // Update Supabase
    try {
      await updateSong(currentSong.id, { lyrics: parsed });
      setSaveSuccessMsg(`Đã lưu thành công ${parsed.length} câu hát đồng bộ Karaoke!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setIsEditingLyrics(false);
    } catch (err) {
      console.error('Lỗi khi lưu lyrics:', err);
    }
  };

  if (!isKaraokeOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080811] flex flex-col animate-in fade-in duration-200 select-none overflow-hidden h-screen w-screen">
      {/* Background dynamic ambient glow from album cover */}
      <div
        className="absolute inset-0 opacity-25 filter blur-[100px] pointer-events-none scale-125 transform transition-all duration-700"
        style={{
          backgroundImage: `url(${currentSong.coverUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#080811]/70 to-[#080811] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-white/10 bg-black/40 backdrop-blur-md gap-2.5">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {/* Left: Song Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-md shrink-0">
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate flex items-center gap-2">
                {currentSong.title}
                {currentSong.album && (
                  <span className="hidden md:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {currentSong.album}
                  </span>
                )}
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5">{currentSong.artist}</p>
            </div>
          </div>

          {/* Right Header Controls on Mobile (< sm) */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            <button
              type="button"
              onClick={openManualEditor}
              className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs cursor-pointer"
              title="Sửa lời thủ công"
            >
              <Edit3 className="w-4 h-4 text-purple-400" />
            </button>
            <button
              type="button"
              onClick={() => setKaraokeOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-white cursor-pointer"
              title="Đóng Karaoke"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Mode Tabs (Karaoke Stage vs Scrolling Lyrics) */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('karaoke')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'karaoke'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Sân khấu Karaoke</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('scrolling')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'scrolling'
                ? 'bg-[var(--accent)] text-white shadow-lg'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lời bài hát cuộn</span>
          </button>
        </div>

        {/* Right: Desktop Manual Lyric Editor & Utility buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Manual Lyrics Edit Button */}
          <button
            type="button"
            onClick={openManualEditor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Thêm hoặc chỉnh sửa lời bài hát thủ công (Định dạng LRC)"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Sửa Lời Thủ Công</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={() => setKaraokeOpen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Đóng chế độ Karaoke (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="relative z-30 mx-4 sm:mx-6 mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center overflow-y-auto px-3 sm:px-6 md:px-12 py-3 sm:py-6">
        {/* MANUAL LYRIC EDITOR MODAL OR EMPTY STATE */}
        {isEditingLyrics || lyrics.length === 0 ? (
          <div className="w-full max-w-xl mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-black/70 border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {lyrics.length === 0 ? 'Nhập Lời Bài Hát Thủ Công' : 'Chỉnh Sửa Lời Bài Hát'}
                </h3>
              </div>
              {lyrics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditingLyrics(false)}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Đóng
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-300">
              Nhập lời bài hát cho <span className="font-bold text-purple-300">{currentSong.title}</span> theo định dạng mốc thời gian LRC:
            </p>

            <textarea
              rows={6}
              value={manualLrcInput}
              onChange={(e) => setManualLrcInput(e.target.value)}
              placeholder="[00:00] Đoạn mở đầu...&#10;[00:15] Câu hát đồng bộ thứ nhất...&#10;[00:30] Câu hát đồng bộ thứ hai..."
              className="w-full p-3 text-xs font-mono bg-white/5 border border-white/10 focus:border-purple-400 rounded-xl sm:rounded-2xl text-white outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] sm:text-[11px] text-neutral-400 font-mono">
                Cú pháp: [MM:SS] Nội dung lời câu hát
              </span>
              <div className="flex items-center gap-2">
                {lyrics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsEditingLyrics(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:bg-white/10"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveManualLyrics}
                  className="flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-transform active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Lời Bài Hát</span>
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'karaoke' ? (
          /* CASE 2: STAGE KARAOKE MODE (Zing MP3 / Pro Karaoke Stage Style) */
          <div className="w-full max-w-5xl my-auto flex flex-col items-center justify-center text-center space-y-4 sm:space-y-8 md:space-y-10 py-2">
            {/* Spinning disc avatar with glowing ring */}
            <div className="flex items-center justify-center">
              <div className="relative group">
                <div
                  className={`w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all ${
                    isPlaying ? 'animate-spin-slow' : 'animation-paused'
                  }`}
                >
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Vinyl Center Hole */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/90 border-2 border-amber-300 flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400" />
                </div>

                {/* Microphone Badge */}
                <div className="absolute -bottom-2 right-1/2 translate-x-1/2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 border border-amber-400/50 text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg whitespace-nowrap">
                  <Mic2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 animate-pulse" />
                  <span>KARAOKE LIVE</span>
                </div>
              </div>
            </div>

            {/* Rhythm Countdown Beat Pulse Dots */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {[0, 1, 2, 3].map((dot) => {
                const isLit = lineProgressRatio * 4 >= dot;
                return (
                  <span
                    key={dot}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-150 ${
                      isLit
                        ? 'bg-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                        : 'bg-white/20 scale-90'
                    }`}
                  />
                );
              })}
            </div>

            {/* 2-LINE KARAOKE DISPLAY */}
            <div className="w-full space-y-3 sm:space-y-5 px-2 sm:px-4 min-h-[110px] sm:min-h-[150px] flex flex-col justify-center items-center">
              {/* LINE 1: ACTIVE CURRENT LYRIC WITH WORD-BY-WORD PROGRESSIVE FILL */}
              {currentLyric ? (
                <div className="relative inline-block max-w-4xl px-2">
                  <h1
                    className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight transition-all duration-75 select-none"
                    style={{
                      backgroundImage: `linear-gradient(to right, #fabb05 0%, #facc15 ${lineProgressRatio * 100}%, rgba(255, 255, 255, 0.35) ${lineProgressRatio * 100}%, rgba(255, 255, 255, 0.35) 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 18px rgba(251, 191, 36, 0.65))',
                    }}
                  >
                    {currentLyric.text}
                  </h1>

                  {/* Singing progress line underneath */}
                  <div className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full mt-2 sm:mt-3.5 overflow-hidden max-w-xs sm:max-w-md mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 rounded-full transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                      style={{ width: `${lineProgressRatio * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-neutral-400/70 italic animate-pulse">
                  (Chuẩn bị vào bài hát...)
                </div>
              )}

              {/* LINE 2: PREVIEW NEXT LYRIC */}
              {nextLyric && (
                <p className="text-sm sm:text-xl md:text-2xl font-bold text-white/50 max-w-2xl px-2 transition-opacity duration-300">
                  {nextLyric.text}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* CASE 3: SCROLLING LYRICS MODE */
          <div
            ref={containerRef}
            className="w-full max-w-3xl flex-1 flex flex-col justify-start items-center overflow-y-auto px-2 sm:px-4 py-8 sm:py-16 scroll-smooth space-y-4 sm:space-y-6 text-center select-none"
          >
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPassed = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 py-1.5 sm:py-2 px-4 sm:px-6 rounded-2xl ${
                    isActive
                      ? `${fontSizeClass} font-black text-amber-300 scale-105 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] bg-white/5 border border-amber-400/30`
                      : isPassed
                      ? 'text-base sm:text-lg md:text-xl font-medium text-neutral-500 hover:text-neutral-300'
                      : 'text-base sm:text-lg md:text-xl font-medium text-neutral-400 hover:text-white'
                  }`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BOTTOM CONTROL DOCK */}
      <footer className="relative z-20 px-3 sm:px-6 py-2.5 sm:py-4 border-t border-white/10 bg-black/70 backdrop-blur-xl flex flex-col gap-2 sm:gap-3">
        {/* Progress Seeker Bar */}
        <div className="w-full max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] sm:text-xs font-mono text-neutral-400 w-8 sm:w-10 text-right tabular-nums">
            {formatSeconds(currentTime)}
          </span>

          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min={0}
              max={songDuration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer group-hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, #f59e0b ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
              }}
            />
          </div>

          <span className="text-[10px] sm:text-xs font-mono text-neutral-400 w-8 sm:w-10 tabular-nums">
            {formatSeconds(songDuration)}
          </span>
        </div>

        {/* Playback & Volume Control Buttons */}
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Font Size controls in Scrolling Mode */}
          <div className="flex items-center gap-1 shrink-0">
            {viewMode === 'scrolling' && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => setFontSizeClass('text-xl')}
                  className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded font-bold ${
                    fontSizeClass === 'text-xl' ? 'bg-white/20 text-white' : 'text-neutral-400'
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeClass('text-2xl')}
                  className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded font-bold ${
                    fontSizeClass === 'text-2xl' ? 'bg-white/20 text-white' : 'text-neutral-400'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeClass('text-3xl')}
                  className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded font-bold ${
                    fontSizeClass === 'text-3xl' ? 'bg-white/20 text-white' : 'text-neutral-400'
                  }`}
                >
                  A+
                </button>
              </div>
            )}
          </div>

          {/* Center: Play, Next, Prev */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              type="button"
              onClick={prevSong}
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Bài trước đó"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 hover:opacity-90 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={nextSong}
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 sm:p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-12 sm:w-20 md:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f59e0b ${
                  (isMuted ? 0 : volume) * 100
                }%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default KaraokeLyricsModal;
