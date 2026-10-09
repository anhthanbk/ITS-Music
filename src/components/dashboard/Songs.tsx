import React, { useState, useEffect, useCallback } from 'react';
import { Music } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { useMusicStore } from '../../store/useMusicStore';

interface SongsProps {
  className?: string;
  onlyCount?: boolean;
}

export const Songs: React.FC<SongsProps> = ({ className = '', onlyCount = false }) => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const storeSongs = useMusicStore((state) => state.songs);

  const fetchUserSongsCount = useCallback(async () => {
    try {
      // 1. Fetch the current authenticated user using supabase.auth.getUser()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setCount(0);
        setIsLoading(false);
        return;
      }

      // 2. Fetch the real count from the Supabase database for the authenticated user
      const { count: dbCount, error: countError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!countError && typeof dbCount === 'number') {
        setCount(dbCount);
      } else {
        // Fallback query if count exact with head is not available
        const { data: userSongs, error: selectError } = await supabase
          .from('songs')
          .select('id')
          .eq('user_id', user.id);

        if (!selectError && userSongs) {
          setCount(userSongs.length);
        } else {
          // Local fallback from store matching authenticated user
          const localUserSongs = storeSongs.filter((s) => s.userId === user.id);
          setCount(localUserSongs.length);
        }
      }
    } catch (err) {
      console.warn('Error fetching user songs count:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeSongs]);

  useEffect(() => {
    fetchUserSongsCount();

    // 3. Realtime subscription: update automatically when a song is created, updated, or deleted
    const channel = supabase
      .channel('realtime:dashboard_songs_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'songs',
        },
        () => {
          fetchUserSongsCount();
        }
      )
      .subscribe();

    // 4. Auth state listener: re-calculate when user signs in or out
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserSongsCount();
    });

    return () => {
      supabase.removeChannel(channel);
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserSongsCount]);

  // If only count is requested
  if (onlyCount) {
    return <span className={className}>{isLoading ? '...' : count}</span>;
  }

  // Metric Card for Dashboard
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-white/10 transition-colors shadow-lg ${className}`}
      data-testid="dashboard-songs-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Songs
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {isLoading ? (
                <span className="inline-block w-8 h-7 bg-white/10 animate-pulse rounded" />
              ) : (
                count
              )}
            </h3>
            <span className="text-xs text-neutral-400">bài hát của bạn</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 text-[var(--accent)] border border-purple-500/20">
          <Music className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

export default Songs;
