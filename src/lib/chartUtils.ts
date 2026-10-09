import { Song, ChartDataPoint } from '../types/music';

/**
 * Generate 24-hour chart data points dynamically based on actual song playsCount.
 * Supports active song live boosts and distinct individual song curve signatures.
 */
export function generateRealChartData(
  top3Songs: Song[],
  activePlayingSongId?: string
): ChartDataPoint[] {
  // Generate 12 two-hour intervals for a 24-hour cycle in GMT+7 (Asia/Ho_Chi_Minh)
  const now = new Date();
  const vietDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const vietDate = new Date(vietDateStr);
  const currentGmt7Hour = vietDate.getHours();

  const hours: string[] = [];
  for (let i = 11; i >= 0; i--) {
    let h = (currentGmt7Hour - i * 2) % 24;
    if (h < 0) h += 24;
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // Base hourly listening curve factors (peaks in afternoon & evening)
  const baseFactors = [0.25, 0.15, 0.1, 0.2, 0.45, 0.65, 0.85, 0.75, 0.88, 0.95, 1.0, 0.8];

  // Helper to get a deterministic numeric seed from string
  const getSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 100);
  };

  const currentHourIdx = 11;

  return hours.map((hour, idx) => {
    const factor = baseFactors[idx % baseFactors.length];

    // Calculate hourly listening count directly proportional to total plays_count
    const computeSongListens = (song?: Song) => {
      if (!song) return 0;

      const plays = Number(song.playsCount) || 0;
      const seed = getSeed(song.id || song.title);

      // Scale baseline hourly value based on song's actual total playsCount
      // Ensures higher playsCount songs display proportionally higher chart lines
      const baseScale = Math.max(1, Math.round(plays * 0.15) + (seed % 5));
      const variation = 1 + 0.12 * Math.sin((idx + (seed % 5)) * 0.8);

      let listens = Math.round(baseScale * factor * variation);

      // If this song is currently playing, apply real-time boost
      if (activePlayingSongId && activePlayingSongId === song.id) {
        if (idx === currentHourIdx || idx === currentHourIdx - 1) {
          listens += Math.round(5 + (plays % 10));
        }
      }

      return Math.max(0, listens);
    };

    return {
      hour,
      song1Listens: computeSongListens(top3Songs[0]),
      song2Listens: computeSongListens(top3Songs[1]),
      song3Listens: computeSongListens(top3Songs[2]),
    };
  });
}

