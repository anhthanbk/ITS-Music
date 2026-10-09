import { create } from 'zustand';
import { UserProfile } from '../types/music';
import { supabase } from '../supabaseClient.js';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_AUTH_USER = 'its_music_auth_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  })(),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const user: UserProfile = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          fullName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
          avatarUrl: data.session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'user',
        };
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
        set({ user, isLoading: false });
        return;
      } else {
        localStorage.removeItem(STORAGE_AUTH_USER);
        set({ user: null, isLoading: false });
        return;
      }
    } catch (e) {
      console.warn('Supabase session check error:', e);
      set({ user: null, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
      if (data.user) {
        const user: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'user',
        };
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
        set({ user, isLoading: false, error: null });
        return { success: true };
      }
      return { success: false, error: 'Không thể đăng nhập' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối Supabase';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });
      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
      if (data.user) {
        const user: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName || email.split('@')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          role: 'user',
        };
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
        set({ user, isLoading: false, error: null });
        return { success: true };
      }
      return { success: false, error: 'Không thể đăng ký' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối Supabase';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error', e);
    }
    localStorage.removeItem(STORAGE_AUTH_USER);
    set({ user: null, isLoading: false, error: null });
  },
}));
