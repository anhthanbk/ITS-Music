import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Song, LyricLine } from '../../types/music';
import {
  X,
  Music2,
  Image,
  Radio,
  Sparkles,
  Upload,
  Loader2,
  AlertCircle,
  Disc3,
  FolderPlus,
  Bot,
  CheckCircle2,
  Tag,
  Plus,
} from 'lucide-react';
import { uploadFileToStorage } from '../../lib/storage';
import { useMusicStore } from '../../store/useMusicStore';

interface SongFormData {
  title: string;
  artist: string;
  genre: string;
  region: 'vpop' | 'usuk' | 'kpop' | 'other';
  duration: number;
  audioUrl: string;
  coverUrl: string;
  lyricsRaw: string;
}

interface SongEditModalProps {
  isOpen: boolean;
  songToEdit: Song | null;
  onClose: () => void;
  onSave: (data: Omit<Song, 'id' | 'createdAt' | 'playsCount'>) => void;
}

export const SongEditModal: React.FC<SongEditModalProps> = ({
  isOpen,
  songToEdit,
  onClose,
  onSave,
}) => {
  const { songs } = useMusicStore();
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [isNewGenreMode, setIsNewGenreMode] = useState(false);

  const PRESET_GENRES = [
    'V-Pop',
    'Ballad',
    'Lofi & Chill',
    'EDM / Dance',
    'Remix',
    'Acoustic',
    'Indie',
    'Rap / Hip-Hop',
    'Pop',
    'Rock',
    'R&B / Soul',
    'Bolero',
    'Jazz',
  ];

  const allGenres = Array.from(
    new Set([...PRESET_GENRES, ...songs.map((s) => s.genre).filter(Boolean)])
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SongFormData>();

  const currentTitle = watch('title');
  const currentArtist = watch('artist');
  const currentDuration = watch('duration');
  const currentGenre = watch('genre');

  useEffect(() => {
    setStorageError(null);
    if (songToEdit) {
      const lyricsStr = (songToEdit.lyrics || [])
        .map((l) => `[${formatLyricSec(l.time)}] ${l.text}`)
        .join('\n');

      reset({
        title: songToEdit.title,
        artist: songToEdit.artist,
        genre: songToEdit.genre,
        region: songToEdit.region,
        duration: songToEdit.duration,
        audioUrl: songToEdit.audioUrl,
        coverUrl: songToEdit.coverUrl,
        lyricsRaw: lyricsStr,
      });
    } else {
      reset({
        title: '',
        artist: '',
        genre: 'V-Pop',
        region: 'vpop',
        duration: 180,
        audioUrl: '',
        coverUrl: '',
        lyricsRaw: '',
      });
    }
  }, [songToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const parseLyrics = (raw: string): LyricLine[] => {
    if (!raw.trim()) return [];
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

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    setStorageError(null);
    try {
      const { signedUrl } = await uploadFileToStorage({
        file,
        featureName: 'songs',
        itemId: songToEdit?.id || 'new',
      });
      setValue('audioUrl', signedUrl);

      // Auto-detect duration from file
      const tempAudio = new Audio(signedUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setValue('duration', Math.round(tempAudio.duration));
        }
      };
    } catch (err: any) {
      setStorageError(err?.message || 'Lỗi khi tải tệp âm thanh lên Supabase Storage.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setStorageError(null);
    try {
      const { signedUrl } = await uploadFileToStorage({
        file,
        featureName: 'covers',
        itemId: songToEdit?.id || 'new',
      });
      setValue('coverUrl', signedUrl);
    } catch (err: any) {
      setStorageError(err?.message || 'Lỗi khi tải ảnh bìa lên Supabase Storage.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onSubmit = async (data: SongFormData) => {
    const parsedLyrics = parseLyrics(data.lyricsRaw);
    setStorageError(null);

    try {
      await onSave({
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        region: data.region,
        duration: Number(data.duration) || 180,
        audioUrl: data.audioUrl,
        coverUrl: data.coverUrl,
        lyrics: parsedLyrics,
      });
      onClose();
    } catch (err: any) {
      console.error('Song save error:', err);
      setStorageError(err?.message || 'Không thể lưu bài hát vào Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {songToEdit ? 'Chỉnh sửa thông tin bài hát' : 'Thêm bài hát mới vào hệ thống'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Tải tệp âm thanh và ảnh bìa trực tiếp lên Supabase Storage (app-files)
            </p>
          </div>
        </div>

        {storageError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{storageError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Tên bài hát <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Cắt Đôi Nỗi Sầu"
                {...register('title', { required: 'Vui lòng nhập tên bài hát' })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
              />
              {errors.title && (
                <p className="text-[11px] text-red-400 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nghệ sĩ thể hiện <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tăng Duy Tân"
                {...register('artist', { required: 'Vui lòng nhập nghệ sĩ' })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
              />
              {errors.artist && (
                <p className="text-[11px] text-red-400 mt-1">{errors.artist.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-pink-400" />
                <span>Thể loại nhạc</span>
              </label>

              {!isNewGenreMode ? (
                <select
                  value={currentGenre || 'V-Pop'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsNewGenreMode(true);
                      setValue('genre', '');
                    } else {
                      setValue('genre', e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none cursor-pointer"
                >
                  {allGenres.map((g) => (
                    <option key={g} value={g}>
                      🎵 {g}
                    </option>
                  ))}
                  <option value="__custom__">+ Thêm thể loại mới...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nhập thể loại..."
                  {...register('genre', { required: 'Vui lòng nhập thể loại' })}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Khu vực phát hành
              </label>
              <select
                {...register('region')}
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none cursor-pointer"
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
                min="10"
                max="1200"
                {...register('duration', {
                  required: 'Nhập thời lượng',
                  valueAsNumber: true,
                })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
              />
            </div>
          </div>

          {/* AUDIO INPUT & UPLOAD */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[var(--accent)]" />
                Tệp Âm thanh (Audio MP3 / URL) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {/* Upload to Supabase Storage button */}
                <label className="text-[10px] px-2.5 py-0.5 rounded bg-[var(--accent)] hover:opacity-90 text-white transition-colors cursor-pointer flex items-center gap-1 font-medium shadow-sm">
                  {isUploadingAudio ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Tải file MP3 lên Storage</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={isUploadingAudio}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <input
              type="url"
              placeholder="Đường dẫn âm thanh Supabase hoặc tải tệp lên từ nút bên trên..."
              {...register('audioUrl', { required: 'Vui lòng tải tệp audio lên hoặc nhập link' })}
              className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none font-mono text-xs"
            />
            {errors.audioUrl && (
              <p className="text-[11px] text-red-400 mt-1">{errors.audioUrl.message}</p>
            )}
          </div>

          {/* COVER IMAGE INPUT & UPLOAD */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-pink-400" />
                Ảnh bìa (Cover Image / Storage) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {/* Upload to Supabase Storage button */}
                <label className="text-[10px] px-2.5 py-0.5 rounded bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer flex items-center gap-1 font-medium shadow-sm">
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Tải ảnh bìa lên Storage</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <input
              type="url"
              placeholder="Đường dẫn ảnh bìa hoặc tải ảnh từ nút bên trên..."
              {...register('coverUrl', { required: 'Vui lòng tải ảnh bìa lên hoặc nhập link' })}
              className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none font-mono text-xs"
            />
            {errors.coverUrl && (
              <p className="text-[11px] text-red-400 mt-1">{errors.coverUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-purple-400" />
                Lời bài hát thủ công (Định dạng LRC Karaoke)
              </label>

              <span className="text-[11px] text-neutral-400">
                Cú pháp: <code className="text-purple-300">[Phút:Giây] Lời bài hát</code>
              </span>
            </div>

            <textarea
              rows={5}
              placeholder="[00:00] Đoạn mở đầu...&#10;[00:15] Câu hát tiếp theo...&#10;[00:30] Câu hát thứ ba..."
              {...register('lyricsRaw')}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAudio || isUploadingCover}
              className="px-5 py-2 text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : songToEdit ? (
                'Lưu thay đổi'
              ) : (
                'Thêm bài hát'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function formatLyricSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
