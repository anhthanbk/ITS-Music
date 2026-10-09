import { Song, ChartDataPoint } from '../types/music';

/**
 * Generate 24-hour chart data points dynamically based on actual song playsCount.
 * Guarantees that songs with higher total playsCount display higher trend lines,
 * and applies a live listening boost when a song is actively playing.
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

  // Peak listening curve throughout the day (afternoon & evening peaks)
  const baseFactors = [0.3, 0.2, 0.15, 0.25, 0.5, 0.7, 0.9, 0.8, 0.92, 0.98, 1.0, 0.85];

  return hours.map((hour, idx) => {
    const factor = baseFactors[idx % baseFactors.length];

    const computeSongListens = (song?: Song) => {
      if (!song) return 0;

      const plays = Math.max(0, Number(song.playsCount) || 0);

      // Base chart values directly on total playsCount
      const hourFactor = 0.9 + 0.1 * Math.sin((idx / 11) * Math.PI);
      let value = Math.round(plays * hourFactor);

      if (activePlayingSongId && activePlayingSongId === song.id && idx >= 10) {
        value += 1;
      }

      return Math.max(0, value);
    };

    return {
      hour,
      song1Listens: computeSongListens(top3Songs[0]),
      song2Listens: computeSongListens(top3Songs[1]),
      song3Listens: computeSongListens(top3Songs[2]),
    };
  });
}


