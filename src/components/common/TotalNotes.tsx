import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useMusicStore } from '../../store/useMusicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Music2, RefreshCw } from 'lucide-react';

interface TotalNotesProps {
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export const TotalNotes: React.FC<TotalNotesProps> = ({
  className = '',
  showIcon = true,
  label = 'Total Notes',
}) => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { songs } = useMusicStore();
  const { user } = useAuthStore();

  const fetchRealCount = useCallback(async () => {
    try {
      // 1. Fetch current authenticated user using supabase.auth.getUser()
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        // Fallback if not logged in
        setCount(0);
        setIsLoading(false);
        return;
      }

      const currentUserId = currentUser.id;

      // 2. Count the number of notes in the "notes" table where user_id = current user id
      const { count: notesCount, error: notesError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId);

      if (!notesError && typeof notesCount === 'number') {
        // Successfully retrieved count from notes table
        setCount(notesCount);
      } else {
        // Fallback for ITS Music "songs" table where user_id = current user id
        const { count: songsCount, error: songsError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUserId);

        if (!songsError && typeof songsCount === 'number') {
          setCount(songsCount);
        } else {
          // If table has RLS/permission fallback, calculate user songs from active state
          const userSongs = songs.filter(
            (s: any) => s.userId === currentUserId || s.user_id === currentUserId
          );
          setCount(userSongs.length);
        }
      }
    } catch (err) {
      console.warn('Error fetching real count from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [songs]);

  useEffect(() => {
    fetchRealCount();

    // 6. Make sure it updates automatically when a note is created or deleted
    // Realtime postgres_changes listener on 'notes' table
    const notesChannel = supabase
      .channel('realtime_notes_table_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          fetchRealCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'songs' },
        () => {
          fetchRealCount();
        }
      )
      .subscribe();

    // Listen for auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchRealCount();
    });

    // Window focus refresh & fallback polling to guarantee sync
    const handleFocus = () => fetchRealCount();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchRealCount, 4000);

    return () => {
      supabase.removeChannel(notesChannel);
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchRealCount]);

  // Re-fetch when user in authStore changes
  useEffect(() => {
    fetchRealCount();
  }, [user, fetchRealCount]);

  return (
    <div
      data-testid="total-notes"
      id="total-notes"
      className={`flex items-center gap-3.5 p-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all ${className}`}
    >
      {showIcon && (
        <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
          <Music2 className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          <span>{label}</span>
          <span className="text-neutral-500 font-normal lowercase">(songs)</span>
        </div>
        <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
          {isLoading ? (
            <span className="text-sm font-normal text-neutral-500 animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải...
            </span>
          ) : (
            <span className="tabular-nums font-mono text-purple-300">
              {count.toLocaleString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Also export alias TotalSongs for flexible usage
export const TotalSongs = TotalNotes;
