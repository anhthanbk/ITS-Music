import { LyricLine } from '../types/music';

/**
 * Format LyricLine array to standard LRC string
 */
export function formatLyricsToLrc(lyrics: LyricLine[]): string {
  if (!lyrics || lyrics.length === 0) return '';
  return lyrics
    .map((l) => {
      const m = Math.floor(l.time / 60);
      const s = Math.floor(l.time % 60);
      return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}] ${l.text}`;
    })
    .join('\n');
}

/**
 * Parse standard LRC string formatted text into LyricLine objects
 */
export function parseLrcToLyrics(lrcText: string): LyricLine[] {
  if (!lrcText || !lrcText.trim()) return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match timecode format like [01:23] or [01:23.45]
    const match = trimmed.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const timeInSecs = mins * 60 + secs + millis / 1000;
      const text = match[4] || '';

      result.push({
        time: timeInSecs,
        text: text,
      });
    } else if (!trimmed.startsWith('[')) {
      // Plain text line without timestamp
      result.push({
        time: result.length > 0 ? result[result.length - 1].time + 4 : 0,
        text: trimmed,
      });
    }
  }

  // Sort by time
  return result.sort((a, b) => a.time - b.time);
}
