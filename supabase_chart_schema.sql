-- ====================================================================
-- SUPABASE SQL EDITOR SCRIPT FOR ITS MUSIC CHART & PLAYS COUNT
-- ====================================================================

-- 1. Ensure 'plays_count' column exists on 'songs' table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS plays_count BIGINT DEFAULT 0;

-- 2. Create index on 'plays_count' for fast ranking and chart queries
CREATE INDEX IF NOT EXISTS idx_songs_plays_count ON public.songs (plays_count DESC);

-- 3. Create stored procedure for atomic play count increments
CREATE OR REPLACE FUNCTION increment_plays_count(song_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.songs
  SET plays_count = COALESCE(plays_count, 0) + 1
  WHERE id = song_id;
$$;

-- 4. Grant table & execute permissions for anon and authenticated users
GRANT ALL ON public.songs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_plays_count(UUID) TO anon, authenticated;
