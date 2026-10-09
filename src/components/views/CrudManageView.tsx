import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Play,
  Music2,
  RefreshCw,
  AlertTriangle,
  Heart,
  Database,
  ListMusic,
  Headphones,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useMusicStore } from '../../store/useMusicStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Song } from '../../types/music';
import { ConfirmModal } from '../common/ConfirmModal';
import { SongEditModal } from '../common/SongEditModal';
import { SongUploadModal } from '../common/SongUploadModal';
import { Songs } from '../dashboard/Songs';

export const CrudManageView: React.FC = () => {
  const { songs, playlists, favorites, addSong, updateSong, deleteSong, resetToDefault } =
    useMusicStore();
  const { playSong } = usePlayerStore();

  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);

  // Mandatory Safety Confirm Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<Song | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Filter songs
  const filtered = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());

    const matchesGenre = selectedGenre === 'all' || s.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genresList = Array.from(new Set(songs.map((s) => s.genre)));

  const handleOpenAdd = () => {
    setSongToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (song: Song) => {
    setSongToEdit(song);
    setIsEditModalOpen(true);
  };

  const handleRequestDelete = (song: Song) => {
    setDeleteCandidate(song);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteCandidate) {
      await deleteSong(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  const handleSaveSong = async (data: Omit<Song, 'id' | 'createdAt' | 'playsCount'>) => {
    if (songToEdit) {
      await updateSong(songToEdit.id, data);
    } else {
      await addSong(data);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Quản trị Dữ liệu Âm nhạc (CRUD)
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Thêm, sửa, xóa bài hát · Tự động đồng bộ Supabase Database & Storage
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Tải lại dữ liệu từ Supabase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đồng bộ lại</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            title="Tải tệp âm thanh trực tiếp lên Supabase Storage"
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên bài hát (Storage)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
            title="Nhập thông tin bài hát thủ công"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm thủ công</span>
          </button>
        </div>
      </div>

      {/* 2. Dashboard Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Authenticated User Songs Count Card */}
        <Songs />

        {/* Playlists Metric Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-white/10 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Playlists
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {playlists.length}
                </h3>
                <span className="text-xs text-neutral-400">tuyển tập</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Total Streams Metric Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-white/10 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Lượt Nghe
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {songs.reduce((acc, s) => acc + (s.playsCount || 0), 0).toLocaleString('vi-VN')}
                </h3>
                <span className="text-xs text-neutral-400">streams</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Favorites Metric Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-white/10 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Yêu Thích
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {favorites.length}
                </h3>
                <span className="text-xs text-neutral-400">đã lưu</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bài hát hoặc nghệ sĩ..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-2 text-xs bg-black/30 border border-white/10 rounded-xl text-white outline-none cursor-pointer"
          >
            <option value="all">Tất cả thể loại</option>
            {genresList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Songs Table */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-[var(--border-subtle)] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Bài hát & Nghệ sĩ</th>
                <th className="py-3 px-4 hidden md:table-cell">Thể loại / Khu vực</th>
                <th className="py-3 px-4 text-right">Lượt nghe</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">Thời lượng</th>
                <th className="py-3 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-neutral-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-[var(--accent)] flex items-center justify-center mx-auto mb-3">
                      <Music2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm md:text-base font-bold text-white">
                      {songs.length === 0
                        ? 'Chưa có bài hát nào trên Supabase Database'
                        : 'Không tìm thấy bài hát nào phù hợp'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      {songs.length === 0
                        ? 'Hệ thống đang hoạt động với cơ sở dữ liệu thực. Hãy tải lên tệp âm thanh đầu tiên của bạn vào Supabase Storage!'
                        : 'Thử tìm với từ khóa khác hoặc xóa bộ lọc thể loại'}
                    </p>
                    {songs.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-90 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Tải lên bài hát đầu tiên ngay</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((song, idx) => (
                  <tr
                    key={song.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-mono text-neutral-400 text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => playSong(song, songs)}
                          className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white truncate group-hover:text-[var(--accent)]">
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 text-[11px]">
                          {song.genre}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">
                          {song.region}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-200">
                      {song.playsCount.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-3 px-4 text-right hidden sm:table-cell font-mono tabular-nums text-neutral-400">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(song)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin bài hát"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestDelete(song)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Xóa bài hát (Yêu cầu xác nhận)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Safety Confirm Modal for Delete */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={`Xóa bài hát "${deleteCandidate?.title || ''}"`}
        message={`Bạn có chắc chắn muốn xóa bài hát "${deleteCandidate?.title}" của ca sĩ ${deleteCandidate?.artist}? Hành động này sẽ loại bỏ vĩnh viễn dữ liệu khỏi hệ thống cơ sở dữ liệu Supabase và không thể khôi phục.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteCandidate(null);
        }}
      />

      {/* Reset confirmation modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Đồng bộ lại từ Supabase?"
        message="Hệ thống sẽ tải lại toàn bộ danh sách bài hát và playlist thực tế từ cơ sở dữ liệu Supabase."
        confirmText="Đồng bộ ngay"
        cancelText="Hủy"
        isDangerous={false}
        onConfirm={() => {
          resetToDefault();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Song Add / Edit Modal with React Hook Form */}
      <SongEditModal
        isOpen={isEditModalOpen}
        songToEdit={songToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSongToEdit(null);
        }}
        onSave={handleSaveSong}
      />

      {/* Dedicated Song Upload to Storage Modal */}
      <SongUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
