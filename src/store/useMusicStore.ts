import { create } from 'zustand';
import { Song, Playlist } from '../types/music';
import { supabase } from '../supabaseClient.js';
import { getSignedFileUrl, deleteFileFromStorage, uploadFileToStorage } from '../lib/storage';
import { useAuthStore } from './useAuthStore';

// Purge any legacy local storage data to guarantee 100% pure Supabase database sync
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('its_music_songs_v1');
    localStorage.removeItem('its_music_playlists_v1');
    localStorage.removeItem('its_music_favorites_v1');
  } catch {
    // ignore
  }
}

interface MusicState {
  songs: Song[];
  playlists: Playlist[];
  albums: string[];
  favorites: string[];
  searchQuery: string;
  activeCategory: string;
  activeRegion: 'all' | 'vpop' | 'usuk' | 'kpop';
  sortOption: 'popular' | 'newest' | 'title';
  isLoading: boolean;

  // Filters & Search
  setSearchQuery: (query: string) => void;
  setActiveCategory: (cat: string) => void;
  setActiveRegion: (region: 'all' | 'vpop' | 'usuk' | 'kpop') => void;
  setSortOption: (sort: 'popular' | 'newest' | 'title') => void;

  // Supabase CRUD - Songs
  loadData: () => Promise<void>;
  createAlbum: (title: string, artist?: string, coverUrl?: string) => Promise<string>;
  uploadSong: (params: {
    audioFile: File;
    coverFile?: File;
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    region?: 'vpop' | 'usuk' | 'kpop' | 'other';
    duration?: number;
    lyrics?: Song['lyrics'];
  }) => Promise<Song>;
  addSong: (data: Omit<Song, 'id' | 'createdAt' | 'playsCount'>) => Promise<Song>;
  updateSong: (id: string, data: Partial<Song>) => Promise<boolean>;
  deleteSong: (id: string) => Promise<boolean>;
  recordPlay: (id: string) => void;

  // Supabase CRUD - Playlists
  createPlaylist: (title: string, description: string, coverUrl?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, title: string, description: string, coverUrl?: string) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<boolean>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;

  // Supabase CRUD - Favorites
  toggleFavorite: (songId: string) => Promise<void>;

  // Reset / Fallback
  resetToDefault: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  songs: [],
  playlists: [],
  albums: [],
  favorites: [],

  searchQuery: '',
  activeCategory: 'Tất cả',
  activeRegion: 'all',
  sortOption: 'popular',
  isLoading: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setActiveRegion: (activeRegion) => set({ activeRegion }),
  setSortOption: (sortOption) => set({ sortOption }),

  // 1. LOADING DATA EXCLUSIVELY FROM SUPABASE DATABASE
  loadData: async () => {
    set({ isLoading: true });
    try {
      // 1.1 Load Songs directly from Supabase
      const { data: dbSongs, error: errSongs } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      const collectedAlbums = new Set<string>();

      if (!errSongs) {
        if (dbSongs && dbSongs.length > 0) {
          // Resolve signed URLs for private files in parallel
          const mappedSongs: Song[] = await Promise.all(
            dbSongs.map(async (s) => {
              if (s.album && typeof s.album === 'string' && s.album.trim()) {
                collectedAlbums.add(s.album.trim());
              }

              const [resolvedAudio, resolvedCover] = await Promise.all([
                getSignedFileUrl(s.audio_url),
                getSignedFileUrl(s.cover_url),
              ]);

              return {
                id: s.id,
                userId: s.user_id,
                title: s.title,
                artist: s.artist,
                album: s.album || '',
                genre: s.genre || 'V-Pop',
                region: s.region || 'vpop',
                duration: s.duration || 180,
                audioUrl: resolvedAudio,
                coverUrl: resolvedCover,
                lyrics: s.lyrics || [],
                playsCount: s.plays_count || 0,
                rank: s.rank,
                createdAt: s.created_at,
              };
            })
          );

          set({ songs: mappedSongs });
        } else {
          set({ songs: [] });
        }
      } else {
        console.warn('Supabase fetch songs warning/error:', errSongs);
      }

      // 1.2 Check if an 'albums' table exists in Supabase
      try {
        const { data: dbAlbums } = await supabase.from('albums').select('title');
        if (dbAlbums && Array.isArray(dbAlbums)) {
          dbAlbums.forEach((a: any) => {
            if (a.title && typeof a.title === 'string' && a.title.trim()) {
              collectedAlbums.add(a.title.trim());
            }
          });
        }
      } catch {
        // Table might not exist yet, that's fine
      }

      // Set synchronized albums list
      const sortedAlbums = Array.from(collectedAlbums).sort((a, b) => a.localeCompare(b));
      set({ albums: sortedAlbums });

      // 1.3 Load Playlists from Supabase
      const { data: dbPlaylists, error: errPl } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errPl) {
        if (dbPlaylists && dbPlaylists.length > 0) {
          const mappedPl: Playlist[] = await Promise.all(
            dbPlaylists.map(async (p) => {
              const resolvedCover = await getSignedFileUrl(
                p.cover_url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
              );

              return {
                id: p.id,
                title: p.title,
                description: p.description || '',
                coverUrl: resolvedCover,
                songIds: Array.isArray(p.song_ids) ? p.song_ids : [],
                isCustom: true,
                createdAt: p.created_at,
              };
            })
          );

          set({ playlists: mappedPl });
        } else {
          set({ playlists: [] });
        }
      }

      // 1.4 Load Favorites from Supabase
      const { data: dbFavs, error: errFav } = await supabase
        .from('favorites')
        .select('song_id');

      if (!errFav) {
        if (dbFavs && dbFavs.length > 0) {
          const favIds = dbFavs.map((f) => f.song_id);
          set({ favorites: favIds });
        } else {
          set({ favorites: [] });
        }
      }
    } catch (err) {
      console.warn('Supabase data load error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // METHOD TO CREATE / REGISTER ALBUM IN SUPABASE
  createAlbum: async (title: string, artist?: string, coverUrl?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return '';

    const currentAlbums = get().albums;
    if (!currentAlbums.includes(trimmedTitle)) {
      set({ albums: [...currentAlbums, trimmedTitle].sort((a, b) => a.localeCompare(b)) });
    }

    // Try saving directly to Supabase albums table if present
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('albums').insert({
        title: trimmedTitle,
        artist: artist || null,
        cover_url: coverUrl || null,
        user_id: user?.id || null,
      });
    } catch {
      // Ignored if table 'albums' does not exist in schema cache
    }

    return trimmedTitle;
  },

  // 2. DEDICATED METHOD TO UPLOAD SONGS (AUDIO + COVER + METADATA TO SUPABASE)
  uploadSong: async (params) => {
    // 2.1 Upload audio file to Supabase Storage bucket 'app-files'
    const { signedUrl: audioUrl } = await uploadFileToStorage({
      file: params.audioFile,
      featureName: 'songs',
    });

    // 2.2 Upload cover image if provided, or use elegant default
    let coverUrl =
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    if (params.coverFile) {
      const { signedUrl: uploadedCover } = await uploadFileToStorage({
        file: params.coverFile,
        featureName: 'covers',
      });
      coverUrl = uploadedCover;
    }

    // 2.3 If album is provided, ensure it is created on Supabase and added to options
    if (params.album && params.album.trim()) {
      await get().createAlbum(params.album.trim(), params.artist, coverUrl);
    }

    // 2.4 Insert new song record into Supabase database
    return await get().addSong({
      title: params.title,
      artist: params.artist,
      album: params.album?.trim() || undefined,
      genre: params.genre || 'V-Pop',
      region: params.region || 'vpop',
      duration: params.duration || 180,
      audioUrl,
      coverUrl,
      lyrics: params.lyrics || [],
    });
  },

  // 2. CREATING NEW SONG IN SUPABASE
  addSong: async (data) => {
    let currentUserId: string | null = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    } catch (authErr) {
      console.warn('Failed to get user for song creation:', authErr);
    }

    if (!currentUserId) {
      currentUserId = useAuthStore.getState().user?.id || null;
    }

    const { data: inserted, error } = await supabase
      .from('songs')
      .insert({
        user_id: currentUserId,
        title: data.title,
        artist: data.artist,
        album: data.album || '',
        genre: data.genre || 'V-Pop',
        region: data.region || 'vpop',
        duration: data.duration || 180,
        audio_url: data.audioUrl,
        cover_url: data.coverUrl,
        lyrics: data.lyrics || [],
        plays_count: 0,
        rank: get().songs.length + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Lỗi khi ghi bài hát vào bảng songs trên Supabase:', error);
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error(
          'Lỗi phân quyền Supabase Database (42501): Chưa cấp quyền GRANT ALL ON public.songs TO anon, authenticated; trên PostgreSQL.'
        );
      }
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('security policy')) {
        throw new Error(
          'Lỗi RLS Supabase Database: Vi phạm Row-Level Security policy trên bảng songs. Vui lòng kiểm tra RLS Policy trên Supabase.'
        );
      }
      throw new Error(`Lỗi lưu bài hát vào Supabase: ${error.message}`);
    }

    const newSong: Song = {
      ...data,
      id: inserted.id,
      userId: inserted.user_id || currentUserId || undefined,
      createdAt: inserted.created_at || new Date().toISOString(),
      playsCount: inserted.plays_count || 0,
      rank: inserted.rank || get().songs.length + 1,
      rankChange: 'same',
    };

    if (data.album && data.album.trim()) {
      const current = get().albums;
      if (!current.includes(data.album.trim())) {
        set({ albums: [...current, data.album.trim()].sort((a, b) => a.localeCompare(b)) });
      }
    }

    const updated = [newSong, ...get().songs];
    set({ songs: updated });
    return newSong;
  },

  // 3. UPDATING SONG IN SUPABASE
  updateSong: async (id, data) => {
    if (data.album && data.album.trim()) {
      const current = get().albums;
      if (!current.includes(data.album.trim())) {
        set({ albums: [...current, data.album.trim()].sort((a, b) => a.localeCompare(b)) });
      }
    }

    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.artist !== undefined) payload.artist = data.artist;
    if (data.genre !== undefined) payload.genre = data.genre;
    if (data.album !== undefined) payload.album = data.album;
    if (data.audioUrl !== undefined) payload.audio_url = data.audioUrl;
    if (data.coverUrl !== undefined) payload.cover_url = data.coverUrl;
    if (data.duration !== undefined) payload.duration = data.duration;
    if (data.region !== undefined) payload.region = data.region;
    if (data.lyrics !== undefined) payload.lyrics = data.lyrics;

    const { error } = await supabase.from('songs').update(payload).eq('id', id);
    if (error) {
      console.error('Lỗi cập nhật bài hát trên Supabase:', error);
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error(
          'Lỗi phân quyền Supabase Database (42501): Chưa cấp quyền UPDATE ON public.songs TO anon, authenticated;'
        );
      }
      throw new Error(`Lỗi cập nhật bài hát trên Supabase: ${error.message}`);
    }

    const updated = get().songs.map((s) => (s.id === id ? { ...s, ...data } : s));
    set({ songs: updated });
    return true;
  },

  // 4. DELETING SONG IN SUPABASE (Storage removal + Database delete)
  deleteSong: async (id) => {
    const songToDelete = get().songs.find((s) => s.id === id);

    // 4.1 Delete associated files from private Storage bucket
    if (songToDelete) {
      try {
        if (songToDelete.audioUrl) {
          await deleteFileFromStorage(songToDelete.audioUrl);
        }
        if (songToDelete.coverUrl) {
          await deleteFileFromStorage(songToDelete.coverUrl);
        }
      } catch (err) {
        console.warn('Lỗi dọn dẹp file từ storage:', err);
      }
    }

    // 4.2 Delete record from Database table
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) {
      console.error('Lỗi xóa bài hát trên Supabase:', error);
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error(
          'Lỗi phân quyền Supabase Database (42501): Chưa cấp quyền DELETE ON public.songs TO anon, authenticated;'
        );
      }
      throw new Error(`Lỗi xóa bài hát trên Supabase: ${error.message}`);
    }

    const updatedSongs = get().songs.filter((s) => s.id !== id);
    const updatedPlaylists = get().playlists.map((pl) => ({
      ...pl,
      songIds: pl.songIds.filter((sid) => sid !== id),
    }));
    const updatedFavorites = get().favorites.filter((fid) => fid !== id);

    set({
      songs: updatedSongs,
      playlists: updatedPlaylists,
      favorites: updatedFavorites,
    });

    return true;
  },

  // RECORD PLAY COUNT
  recordPlay: (id) => {
    const updated = get().songs.map((s) => {
      if (s.id === id) {
        const nextCount = s.playsCount + 1;
        supabase.from('songs').update({ plays_count: nextCount }).eq('id', id).then();
        return { ...s, playsCount: nextCount };
      }
      return s;
    });
    set({ songs: updated });
  },

  // 5. CREATING PLAYLIST IN SUPABASE
  createPlaylist: async (title, description, coverUrl) => {
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      title,
      description,
      coverUrl:
        coverUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      songIds: [],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: inserted, error } = await supabase
          .from('playlists')
          .insert({
            user_id: session.user.id,
            title: newPl.title,
            description: newPl.description,
            cover_url: newPl.coverUrl,
            song_ids: [],
            is_custom: true,
          })
          .select()
          .single();

        if (!error && inserted) {
          newPl.id = inserted.id;
        }
      }
    } catch (e) {
      console.warn('Error inserting playlist in Supabase:', e);
    }

    const updated = [newPl, ...get().playlists];
    set({ playlists: updated });
    return newPl;
  },

  // 6. UPDATING PLAYLIST IN SUPABASE
  updatePlaylist: async (id, title, description, coverUrl) => {
    try {
      await supabase
        .from('playlists')
        .update({
          title,
          description,
          cover_url: coverUrl,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Error updating playlist in Supabase:', e);
    }

    const updated = get().playlists.map((pl) =>
      pl.id === id
        ? {
            ...pl,
            title,
            description,
            coverUrl: coverUrl || pl.coverUrl,
          }
        : pl
    );
    set({ playlists: updated });
    return true;
  },

  // 7. DELETING PLAYLIST IN SUPABASE (Storage removal + Database delete)
  deletePlaylist: async (id) => {
    const plToDelete = get().playlists.find((p) => p.id === id);

    // 7.1 Remove cover image from storage if uploaded to app-files
    if (plToDelete?.coverUrl) {
      try {
        await deleteFileFromStorage(plToDelete.coverUrl);
      } catch (err) {
        console.warn('Error removing playlist cover from storage:', err);
      }
    }

    // 7.2 Delete from Database table
    try {
      await supabase.from('playlists').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting playlist in Supabase:', e);
    }

    const updated = get().playlists.filter((pl) => pl.id !== id);
    set({ playlists: updated });
    return true;
  },

  // 8. ADD/REMOVE SONG IN PLAYLIST IN SUPABASE
  addSongToPlaylist: async (playlistId, songId) => {
    const pl = get().playlists.find((p) => p.id === playlistId);
    if (!pl || pl.songIds.includes(songId)) return false;

    const newSongIds = [...pl.songIds, songId];
    try {
      await supabase.from('playlists').update({ song_ids: newSongIds }).eq('id', playlistId);
    } catch (e) {
      console.warn('Error updating playlist songs in Supabase:', e);
    }

    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: newSongIds } : p
    );
    set({ playlists: updated });
    return true;
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    const pl = get().playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const newSongIds = pl.songIds.filter((sid) => sid !== songId);
    try {
      await supabase.from('playlists').update({ song_ids: newSongIds }).eq('id', playlistId);
    } catch (e) {
      console.warn('Error removing song from playlist in Supabase:', e);
    }

    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: newSongIds } : p
    );
    set({ playlists: updated });
    return true;
  },

  // 9. TOGGLE FAVORITE IN SUPABASE
  toggleFavorite: async (songId) => {
    const { favorites } = get();
    const isFav = favorites.includes(songId);
    const next = isFav ? favorites.filter((id) => id !== songId) : [...favorites, songId];

    set({ favorites: next });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (isFav) {
          // Remove favorite
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', session.user.id)
            .eq('song_id', songId);
        } else {
          // Add favorite
          await supabase.from('favorites').insert({
            user_id: session.user.id,
            song_id: songId,
          });
        }
      }
    } catch (e) {
      console.warn('Error syncing favorite with Supabase:', e);
    }
  },

  // RESET & RELOAD FROM SUPABASE DATABASE
  resetToDefault: async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('its_music_songs_v1');
        localStorage.removeItem('its_music_playlists_v1');
        localStorage.removeItem('its_music_favorites_v1');
      } catch {
        // ignore
      }
    }
    set({
      songs: [],
      playlists: [],
      favorites: [],
    });
    await get().loadData();
  },
}));
