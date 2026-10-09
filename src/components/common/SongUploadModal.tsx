import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Music2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  Sparkles,
  FileAudio,
} from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMusicStore } from '../../store/useMusicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Song, LyricLine } from '../../types/music';

interface SongUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (song: Song) => void;
  onOpenAuth?: () => void;
}

interface UploadFormData {
  title: string;
  artist: string;
  album?: string;
  genre: string;
  region: 'vpop' | 'usuk' | 'kpop' | 'other';
  duration: number;
  lyricsRaw?: string;
}

export const SongUploadModal: React.FC<SongUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const { user } = useAuthStore();
  const { uploadSong } = useMusicStore();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isAudioDragOver, setIsAudioDragOver] = useState(false);
  const [isCoverDragOver, setIsCoverDragOver] = useState(false);

  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    defaultValues: {
      title: '',
      artist: '',
      album: '',
      genre: 'V-Pop',
      region: 'vpop',
      duration: 180,
      lyricsRaw: '',
    },
  });

  if (!isOpen) return null;

  const handleAudioSelection = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setErrorMessage('Vui lòng chọn một tệp âm thanh hợp lệ (.mp3, .wav, .m4a, .aac, .ogg, .flac).');
      return;
    }

    setErrorMessage(null);
    setAudioFile(file);

    // 1. Create preview URL
    const objUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(objUrl);

    // 2. Parse file name to auto-fill Title and Artist
    const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ');
      setValue('artist', parts[0].trim());
      setValue('title', parts.slice(1).join(' - ').trim());
    } else if (rawName.includes('-')) {
      const parts = rawName.split('-');
      setValue('artist', parts[0].trim());
      setValue('title', parts.slice(1).join('-').trim());
    } else {
      setValue('title', rawName);
      if (user?.fullName) {
        setValue('artist', user.fullName);
      }
    }

    // 3. Auto-detect duration using Audio metadata
    const tempAudio = new Audio(objUrl);
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        setValue('duration', Math.round(tempAudio.duration));
      }
    };
  };

  const handleCoverSelection = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn một tệp hình ảnh hợp lệ (.jpg, .jpeg, .png, .webp).');
      return;
    }

    setErrorMessage(null);
    setCoverFile(file);
    const objUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(objUrl);
  };

  const parseLyrics = (raw?: string): LyricLine[] => {
    if (!raw || !raw.trim()) return [];
    const lines = raw.split('\n');
    const result: LyricLine[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^\[(\d{1,2}):(\d{1,2})\]\s*(.*)$/);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        result.push({
          time: mins * 60 + secs,
          text: match[3],
        });
      } else {
        result.push({
          time: index * 10,
          text: trimmed,
        });
      }
    });

    return result.sort((a, b) => a.time - b.time);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const onSubmit: SubmitHandler<UploadFormData> = async (data) => {
    if (!audioFile) {
      setErrorMessage('Vui lòng chọn hoặc kéo thả tệp âm thanh cần tải lên.');
      return;
    }

    if (!user) {
      setErrorMessage('Bạn cần đăng nhập tài khoản Supabase trước khi tải lên bài hát.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      setUploadStep('1/3 Đang tải tệp âm thanh lên Supabase Storage (app-files)...');

      const parsedLyrics = parseLyrics(data.lyricsRaw);

      setUploadStep('2/3 Đang xử lý ảnh bìa và siêu dữ liệu...');

      const newSong = await uploadSong({
        audioFile,
        coverFile: coverFile || undefined,
        title: data.title,
        artist: data.artist,
        album: data.album || undefined,
        genre: data.genre,
        region: data.region,
        duration: Number(data.duration) || 180,
        lyrics: parsedLyrics,
      });

      setUploadStep('3/3 Đã lưu thành công vào Supabase Database!');

      setTimeout(() => {
        setIsSubmitting(false);
        setUploadStep(null);
        reset();
        setAudioFile(null);
        setCoverFile(null);
        if (onSuccess) onSuccess(newSong);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Song upload failure:', err);
      setErrorMessage(
        err?.message ||
          'Không thể tải bài hát lên Supabase. Vui lòng kiểm tra quyền truy cập Supabase Storage/Database hoặc thử lại.'
      );
      setIsSubmitting(false);
      setUploadStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 md:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Tải Lên Bài Hát Mới
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Supabase Storage
              </span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Lưu trực tiếp vào bucket <span className="font-mono text-purple-300">app-files</span> và bảng <span className="font-mono text-purple-300">songs</span>
            </p>
          </div>
        </div>

        {/* Auth Warning if not signed in */}
        {!user && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Bạn cần đăng nhập tài khoản Supabase trước khi tải bài hát lên.</span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 cursor-pointer transition-colors"
              >
                Đăng nhập ngay
              </button>
            )}
          </div>
        )}

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-200">Lỗi tải lên:</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 1. AUDIO FILE DROPZONE */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              1. Tệp Âm Thanh (.mp3, .wav, .m4a, .flac) <span className="text-red-400">*</span>
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsAudioDragOver(true);
              }}
              onDragLeave={() => setIsAudioDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsAudioDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleAudioSelection(file);
              }}
              onClick={() => audioInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                isAudioDragOver
                  ? 'border-[var(--accent)] bg-[var(--accent-light)] scale-[1.01]'
                  : audioFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/15 hover:border-[var(--accent)]/50 bg-black/20 hover:bg-white/5'
              }`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioSelection(file);
                }}
                className="hidden"
              />

              {audioFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{audioFile.name}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB · Sẵn sàng tải lên Supabase Storage
                      </p>
                    </div>
                  </div>

                  {audioPreviewUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreviewPlay();
                      }}
                      className="p-2.5 rounded-full bg-[var(--accent)] hover:opacity-90 text-white shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
                      title={isPlayingPreview ? 'Tạm dừng nghe thử' : 'Nghe thử tệp âm thanh'}
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 text-[var(--accent)] flex items-center justify-center mx-auto mb-2.5">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Kéo thả tệp âm thanh vào đây hoặc <span className="text-[var(--accent)] underline">chọn từ thiết bị</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Hỗ trợ tệp MP3, WAV, AAC, M4A, FLAC · Tự động phát hiện thời lượng và tên ca khúc
                  </p>
                </div>
              )}

              {/* Hidden preview audio element */}
              {audioPreviewUrl && (
                <audio
                  ref={previewAudioRef}
                  src={audioPreviewUrl}
                  onEnded={() => setIsPlayingPreview(false)}
                  className="hidden"
                />
              )}
            </div>
          </div>

          {/* 2. COVER ART & BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Cover Art Dropzone (4 cols) */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                2. Ảnh Bìa (Cover Art)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsCoverDragOver(true);
                }}
                onDragLeave={() => setIsCoverDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsCoverDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCoverSelection(file);
                }}
                onClick={() => coverInputRef.current?.click()}
                className={`relative aspect-square border-2 border-dashed rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-3 transition-all cursor-pointer group ${
                  isCoverDragOver
                    ? 'border-pink-500 bg-pink-500/10'
                    : coverPreviewUrl
                    ? 'border-transparent'
                    : 'border-white/15 hover:border-pink-500/50 bg-black/20 hover:bg-white/5'
                }`}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverSelection(file);
                  }}
                  className="hidden"
                />

                {coverPreviewUrl ? (
                  <>
                    <img
                      src={coverPreviewUrl}
                      alt="Cover Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-semibold p-2">
                      <ImageIcon className="w-5 h-5 mb-1" />
                      <span>Đổi ảnh bìa</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">
                      Kéo thả ảnh bìa hoặc tải lên
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-0.5">JPG, PNG, WEBP</span>
                  </>
                )}
              </div>
            </div>

            {/* Song Details (8 cols) */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tên bài hát <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đừng Làm Trái Tim Anh Đau"
                  {...register('title', { required: 'Vui lòng nhập tên bài hát' })}
                  className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
                />
                {errors.title && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nghệ sĩ thể hiện <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sơn Tùng M-TP"
                    {...register('artist', { required: 'Vui lòng nhập tên nghệ sĩ' })}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
                  />
                  {errors.artist && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.artist.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Album (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Single 2026"
                    {...register('album')}
                    className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Thể loại
                  </label>
                  <select
                    {...register('genre')}
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="V-Pop">V-Pop</option>
                    <option value="Ballad">Ballad</option>
                    <option value="Lofi">Lofi & Chill</option>
                    <option value="EDM">EDM / Dance</option>
                    <option value="Remix">Remix</option>
                    <option value="Acoustic">Acoustic</option>
                    <option value="Indie">Indie</option>
                    <option value="Rap">Rap / Hip-Hop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Khu vực
                  </label>
                  <select
                    {...register('region')}
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="vpop">Việt Nam</option>
                    <option value="usuk">Âu Mỹ (US-UK)</option>
                    <option value="kpop">Hàn Quốc (K-Pop)</option>
                    <option value="other">Quốc tế khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Thời lượng (giây)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3600"
                    {...register('duration', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. LYRICS (OPTIONAL) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Lời bài hát (Đồng bộ Karaoke, định dạng [mm:ss])
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">Không bắt buộc</span>
            </div>
            <textarea
              rows={3}
              placeholder="[00:00] Giai điệu bắt đầu...&#10;[00:15] Câu hát đồng bộ theo giây..."
              {...register('lyricsRaw')}
              className="w-full px-3.5 py-2 text-xs font-mono bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none resize-none"
            />
          </div>

          {/* Upload Progress Bar if active */}
          {uploadStep && (
            <div className="p-3.5 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent)]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadStep}</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent)] animate-pulse rounded-full w-full" />
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !audioFile}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên Supabase...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Tải lên và Lưu vào Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SongUploadModal;
