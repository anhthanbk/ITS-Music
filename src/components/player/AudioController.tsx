import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useMusicStore } from '../../store/useMusicStore';

export const AudioController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedPlayRef = useRef<string | null>(null);

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    repeatMode,
    nextSong,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  } = usePlayerStore();

  const { recordPlay } = useMusicStore();

  // Handle song source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      if (audio.src !== currentSong.audioUrl) {
        audio.src = currentSong.audioUrl;
        audio.load();
        recordedPlayRef.current = null;
        if (isPlaying) {
          audio.play().catch((err) => {
            console.warn('Audio play error, handling fallback:', err);
            // In case of autoplay policy, user click resumes
          });
        }
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
    }
  }, [currentSong]);

  // Handle Play / Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback error:', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // Handle Volume / Mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle Manual Seek from UI
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - currentTime) > 1.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    // Record play count once 8 seconds elapsed
    if (currentSong && audio.currentTime > 8 && recordedPlayRef.current !== currentSong.id) {
      recordPlay(currentSong.id);
      recordedPlayRef.current = currentSong.id;
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    } else if (currentSong?.duration) {
      setDuration(currentSong.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      }
    } else {
      nextSong();
    }
  };

  const handleError = () => {
    console.warn('Audio element reported error loading:', currentSong?.audioUrl);
    // Continue or skip gracefully
  };

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onError={handleError}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      preload="auto"
      className="hidden"
    />
  );
};
