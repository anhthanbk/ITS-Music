import { create } from 'zustand';
import { Song, Playlist } from '../types/music';
import { supabase } from '../supabaseClient.js';
import { getSignedFileUrl, deleteFileFromStorage, uploadFileToStorage } from '../lib/storage';
import { useAuthStore } from './useAuthStore';
import { usePlayerStore } from './usePlayerStore';

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

      if (!errSongs) {
        if (dbSongs && dbSongs.length > 0) {
          // Resolve signed URLs for private files in parallel
          const mappedSongs: Song[] = await Promise.all(
            dbSongs.map(async (s) => {
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

      // 1.2 Load Playlists from Supabase
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

  // DEDICATED METHOD TO UPLOAD SONGS (AUDIO + COVER + METADATA TO SUPABASE)
  uploadSong: async (params) => {
    // Upload audio file to Supabase Storage bucket 'app-files'
    const { signedUrl: audioUrl } = await uploadFileToStorage({
      file: params.audioFile,
      featureName: 'songs',
    });

    // Upload cover image if provided, or use elegant default
    let coverUrl =
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    if (params.coverFile) {
      const { signedUrl: uploadedCover } = await uploadFileToStorage({
        file: params.coverFile,
        featureName: 'covers',
      });
      coverUrl = uploadedCover;
    }

    // Insert new song record into Supabase database
    return await get().addSong({
      title: params.title,
      artist: params.artist,
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

    const updated = [newSong, ...get().songs];
    set({ songs: updated });
    return newSong;
  },

  // 3. UPDATING SONG IN SUPABASE
  updateSong: async (id, data) => {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.artist !== undefined) payload.artist = data.artist;
    if (data.genre !== undefined) payload.genre = data.genre;
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
    let newCount = 0;
    const updated = get().songs.map((s) => {
      if (s.id === id) {
        newCount = (s.playsCount || 0) + 1;
        return { ...s, playsCount: newCount };
      }
      return s;
    });
    set({ songs: updated });

    // Update active playerStore song if matching
    try {
      const { currentSong, updateCurrentSong } = usePlayerStore.getState();
      if (currentSong && currentSong.id === id) {
        updateCurrentSong({ ...currentSong, playsCount: newCount });
      }
    } catch {
      // ignore
    }

    // Persist to Supabase songs table
    if (newCount > 0) {
      supabase.from('songs').update({ plays_count: newCount }).eq('id', id).then();
    }
  },

  // 5. CREATING PLAYLIST IN SUPABASE
  createPlaylist: async (title, description, coverUrl) => {
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      title: title.trim(),
      description: description?.trim() || '',
      coverUrl:
        coverUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      songIds: [],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      let currentUserId: string | null = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
      } catch (authErr) {
        console.warn('Could not get auth user for playlist:', authErr);
      }

      if (!currentUserId) {
        currentUserId = useAuthStore.getState().user?.id || null;
      }

      const { data: inserted, error } = await supabase
        .from('playlists')
        .insert({
          user_id: currentUserId,
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
      } else if (error) {
        console.error('Lỗi khi tạo playlist trên Supabase:', error);
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
          title: title.trim(),
          description: description?.trim() || '',
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
            title: title.trim(),
            description: description?.trim() || '',
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

    if (plToDelete?.coverUrl) {
      try {
        await deleteFileFromStorage(plToDelete.coverUrl);
      } catch (err) {
        console.warn('Error removing playlist cover from storage:', err);
      }
    }

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
    if (!pl) return false;
    if (pl.songIds.includes(songId)) return true;

    const newSongIds = [...pl.songIds, songId];

    // Optimistic local update
    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: newSongIds } : p
    );
    set({ playlists: updated });

    try {
      const { error } = await supabase
        .from('playlists')
        .update({ song_ids: newSongIds })
        .eq('id', playlistId);

      if (error) {
        console.warn('Lỗi cập nhật danh sách bài hát trong playlist trên Supabase:', error);
      }
    } catch (e) {
      console.warn('Error updating playlist songs in Supabase:', e);
    }

    return true;
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    const pl = get().playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const newSongIds = pl.songIds.filter((sid) => sid !== songId);

    // Optimistic local update
    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: newSongIds } : p
    );
    set({ playlists: updated });

    try {
      const { error } = await supabase
        .from('playlists')
        .update({ song_ids: newSongIds })
        .eq('id', playlistId);

      if (error) {
        console.warn('Lỗi xóa bài hát khỏi playlist trên Supabase:', error);
      }
    } catch (e) {
      console.warn('Error removing song from playlist in Supabase:', e);
    }

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
