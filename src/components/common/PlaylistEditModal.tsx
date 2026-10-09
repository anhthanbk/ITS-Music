import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Playlist } from '../../types/music';
import { X, ListMusic, Image, Upload, Loader2, AlertCircle } from 'lucide-react';
import { uploadFileToStorage } from '../../lib/storage';

interface PlaylistFormData {
  title: string;
  description: string;
  coverUrl: string;
}

interface PlaylistEditModalProps {
  isOpen: boolean;
  playlistToEdit: Playlist | null;
  onClose: () => void;
  onSave: (title: string, description: string, coverUrl: string) => void;
}

const SAMPLE_PLAYLIST_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80',
];

export const PlaylistEditModal: React.FC<PlaylistEditModalProps> = ({
  isOpen,
  playlistToEdit,
  onClose,
  onSave,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PlaylistFormData>();

  useEffect(() => {
    setUploadError(null);
    if (playlistToEdit) {
      reset({
        title: playlistToEdit.title,
        description: playlistToEdit.description,
        coverUrl: playlistToEdit.coverUrl,
      });
    } else {
      reset({
        title: '',
        description: '',
        coverUrl: SAMPLE_PLAYLIST_COVERS[0],
      });
    }
  }, [playlistToEdit, isOpen, reset]);

  if (!isOpen) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const { signedUrl } = await uploadFileToStorage({
        file,
        featureName: 'playlists',
        itemId: playlistToEdit?.id || 'new',
      });
      setValue('coverUrl', signedUrl);
    } catch (err: any) {
      setUploadError(err?.message || 'Lỗi khi tải ảnh bìa lên Supabase Storage.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: PlaylistFormData) => {
    setUploadError(null);
    try {
      await onSave(data.title, data.description, data.coverUrl);
      onClose();
    } catch (err: any) {
      setUploadError(err?.message || 'Lỗi khi lưu playlist vào Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <ListMusic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {playlistToEdit ? 'Chỉnh sửa Playlist' : 'Tạo Playlist Mới'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Tải ảnh bìa lên Supabase Storage (app-files)
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Tên Playlist <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Giai điệu mùa hạ"
              {...register('title', { required: 'Vui lòng nhập tên playlist' })}
              className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none"
            />
            {errors.title && (
              <p className="text-[11px] text-red-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Nhạc chill để làm việc và học tập..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-pink-400" />
                Ảnh bìa Playlist <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {/* Upload file directly to Supabase Storage */}
                <label className="text-[10px] px-2.5 py-0.5 rounded bg-[var(--accent)] hover:opacity-90 text-white transition-colors cursor-pointer flex items-center gap-1 font-medium shadow-sm">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Tải ảnh lên Storage</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                <span className="text-[10px] text-neutral-400">Chọn nhanh:</span>
                {SAMPLE_PLAYLIST_COVERS.slice(0, 2).map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setValue('coverUrl', url)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-[var(--accent)] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Bìa {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="url"
              placeholder="Đường dẫn ảnh bìa hoặc tải ảnh lên từ nút bên trên..."
              {...register('coverUrl', { required: 'Vui lòng cung cấp link ảnh bìa hoặc tải ảnh lên' })}
              className="w-full px-3.5 py-2.5 text-sm bg-black/40 border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-xl text-white outline-none font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : playlistToEdit ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
