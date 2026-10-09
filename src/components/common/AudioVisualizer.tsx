import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

interface AudioVisualizerProps {
  variant?: 'bars' | 'wave' | 'mini' | 'stage';
  barCount?: number;
  height?: number; // in pixels
  className?: string;
  colorTheme?: 'neon' | 'amber' | 'purple' | 'cyan';
  showPeaks?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  variant = 'bars',
  barCount,
  height = 48,
  className = '',
  colorTheme = 'neon',
  showPeaks = true,
}) => {
  const { isPlaying, volume, isMuted, currentTime } = usePlayerStore();

  const numBars = barCount || (variant === 'stage' ? 40 : variant === 'mini' ? 5 : 24);
  const [bars, setBars] = useState<number[]>(() => Array(numBars).fill(12));
  const [peaks, setPeaks] = useState<number[]>(() => Array(numBars).fill(12));

  const animFrameRef = useRef<number | null>(null);
  const peaksVelocityRef = useRef<number[]>(Array(numBars).fill(0));
  const effectiveVolume = isMuted ? 0 : volume;

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const t = now * 0.003; // Time scalar
      const currentVol = isPlaying ? Math.max(0.2, effectiveVolume) : 0;

      // Rhythm beat pulse generator (4/4 time signature kick)
      const beatCycle = (currentTime * 2.2) % 1; // Approx 132 BPM
      const kickImpulse = Math.pow(1 - beatCycle, 3) * 0.45;

      setBars((prevBars) => {
        const nextBars = new Array(numBars);
        const nextPeaks = [...peaks];

        for (let i = 0; i < numBars; i++) {
          const normIdx = i / numBars; // 0 to 1

          if (isPlaying) {
            // Bass emphasis on left (low normIdx), highs on right
            const bassWeight = Math.pow(1 - normIdx, 1.8) * 1.4;
            const midWeight = Math.sin(normIdx * Math.PI) * 1.1;
            const highWeight = Math.pow(normIdx, 1.5) * 0.9;

            // Multi-frequency harmonic waves
            const wave1 = Math.sin(t * 4 + i * 0.45);
            const wave2 = Math.cos(t * 7 - i * 0.7);
            const wave3 = Math.sin(t * 11 + i * 1.2);
            const noise = (Math.sin(i * 99 + t * 15) + 1) * 0.15;

            // Combine harmonics
            let targetEnergy =
              (wave1 * 0.4 + wave2 * 0.35 + wave3 * 0.25 + 1) * 0.5 +
              kickImpulse * (bassWeight + 0.3) +
              noise;

            // Apply frequency curve
            const weight = bassWeight * 0.5 + midWeight * 0.35 + highWeight * 0.15;
            targetEnergy *= weight * currentVol * 100;

            // Clamp between 8% and 98%
            const targetHeight = Math.max(8, Math.min(98, targetEnergy));

            // Smooth interpolation (attack vs release)
            const prev = prevBars[i] || 10;
            const lerpSpeed = targetHeight > prev ? 0.45 : 0.2;
            const newHeight = prev + (targetHeight - prev) * lerpSpeed;
            nextBars[i] = newHeight;

            // Update peak with gravity
            if (showPeaks) {
              if (newHeight > nextPeaks[i]) {
                nextPeaks[i] = newHeight;
                peaksVelocityRef.current[i] = 0;
              } else {
                peaksVelocityRef.current[i] += 40 * dt; // gravity
                nextPeaks[i] = Math.max(newHeight, nextPeaks[i] - peaksVelocityRef.current[i] * dt);
              }
            }
          } else {
            // Idle decay to baseline
            const prev = prevBars[i] || 10;
            nextBars[i] = Math.max(6, prev * 0.92);
            if (showPeaks) {
              nextPeaks[i] = Math.max(6, nextPeaks[i] * 0.9);
            }
          }
        }

        if (showPeaks) {
          setPeaks(nextPeaks);
        }

        return nextBars;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, effectiveVolume, currentTime, numBars, showPeaks]);

  // Gradient styles according to colorTheme
  const getBarGradient = (idx: number) => {
    switch (colorTheme) {
      case 'amber':
        return 'from-amber-500 via-yellow-400 to-amber-200';
      case 'purple':
        return 'from-purple-600 via-pink-500 to-indigo-400';
      case 'cyan':
        return 'from-cyan-500 via-teal-400 to-emerald-300';
      case 'neon':
      default: {
        // Multi-color spectrum from left to right
        const ratio = idx / numBars;
        if (ratio < 0.33) {
          return 'from-purple-600 via-pink-500 to-rose-400';
        } else if (ratio < 0.66) {
          return 'from-pink-500 via-amber-400 to-yellow-300';
        } else {
          return 'from-amber-400 via-emerald-400 to-cyan-300';
        }
      }
    }
  };

  const getPeakColor = () => {
    switch (colorTheme) {
      case 'amber':
        return 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]';
      case 'purple':
        return 'bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.9)]';
      case 'cyan':
        return 'bg-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.9)]';
      case 'neon':
      default:
        return 'bg-amber-200 shadow-[0_0_8px_rgba(253,224,71,0.9)]';
    }
  };

  if (variant === 'mini') {
    return (
      <div
        className={`flex items-end justify-center gap-1 ${className}`}
        style={{ height: `${height}px` }}
        title={isPlaying ? 'Đang phát âm thanh...' : 'Tạm dừng'}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t ${getBarGradient(i)} transition-all duration-75`}
            style={{
              height: `${h}%`,
              opacity: isPlaying ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-end justify-center select-none overflow-visible ${className}`}
      style={{ height: `${height}px` }}
      aria-label="Equalizer nhảy theo nhạc"
    >
      {/* Background ambient glow when playing */}
      {isPlaying && variant === 'stage' && (
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-amber-500/10 to-transparent blur-xl pointer-events-none" />
      )}

      <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full h-full px-1">
        {bars.map((barHeight, i) => {
          const peakHeight = peaks[i] || barHeight;

          return (
            <div
              key={i}
              className="relative flex flex-col justify-end items-center h-full flex-1 max-w-[12px] group"
            >
              {/* Floating peak cap dot */}
              {showPeaks && isPlaying && (
                <span
                  className={`absolute w-full h-1 sm:h-1.5 rounded-full ${getPeakColor()} transition-transform pointer-events-none`}
                  style={{
                    bottom: `${Math.min(99, peakHeight)}%`,
                    opacity: peakHeight > 10 ? 0.95 : 0,
                  }}
                />
              )}

              {/* Main frequency bar */}
              <div
                className={`w-full rounded-t-md sm:rounded-t-lg bg-gradient-to-t ${getBarGradient(i)} shadow-sm transition-all duration-75 ${
                  isPlaying ? 'opacity-95 shadow-[0_0_12px_rgba(244,114,182,0.3)]' : 'opacity-30'
                }`}
                style={{
                  height: `${barHeight}%`,
                  minHeight: '4px',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioVisualizer;
