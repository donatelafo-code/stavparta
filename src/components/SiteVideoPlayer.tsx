import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Volume2,
  VolumeX,
  Film,
  Clock,
} from 'lucide-react';
import { ProjectVideo } from '../types';

interface SiteVideoPlayerProps {
  video: ProjectVideo;
  compact?: boolean;
  autoFocusPoster?: boolean;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SiteVideoPlayer: React.FC<SiteVideoPlayerProps> = (props) => (
  <SiteVideoPlayerInner key={props.video.url} {...props} />
);

const SiteVideoPlayerInner: React.FC<SiteVideoPlayerProps> = ({
  video,
  compact = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el || hasError) return;
    if (el.paused || el.ended) {
      el.playbackRate = playbackRate;
      el.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    setCurrentTime(0);
    el.play()
      .then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      })
      .catch(() => {});
  };

  const handleSeek = (nextSec: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = nextSec;
    setCurrentTime(nextSec);
    if (el.paused) {
      el.playbackRate = playbackRate;
      el.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    const next = !isMuted;
    setIsMuted(next);
    if (el) el.muted = next;
  };

  const handleFullscreen = () => {
    const el = videoRef.current || containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  // Determine currently active chapter index based on playback progress
  const activeChapterIndex = (() => {
    if (!video.chapters || video.chapters.length === 0) return -1;
    let matched = 0;
    for (let i = 0; i < video.chapters.length; i++) {
      if (currentTime >= video.chapters[i].timeSec - 0.15) {
        matched = i;
      }
    }
    return matched;
  })();

  const activeChapter =
    activeChapterIndex >= 0 && video.chapters ? video.chapters[activeChapterIndex] : null;

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      {/* Video Frame */}
      <div
        className={`relative bg-[#0F171E] overflow-hidden select-none ${
          compact ? 'aspect-16/10' : 'aspect-video rounded-xl border border-slate-800 shadow-lg'
        }`}
      >
        {!hasError ? (
          <video
            ref={videoRef}
            src={video.url}
            poster={video.posterUrl}
            muted={isMuted}
            playsInline
            preload="metadata"
            onClick={togglePlay}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setDuration(d);
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => {
              setIsPlaying(true);
              setHasStarted(true);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          <div className="relative w-full h-full bg-slate-900">
            <img
              src={video.posterUrl}
              alt={video.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center p-4 text-center text-white">
              <Film className="w-8 h-8 text-[#F07818] mb-2" />
              <p className="text-sm font-bold">{video.title}</p>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Video záznam je připraven ke spuštění v prohlížeči podporujícím formát MP4/H.264.
              </p>
            </div>
          </div>
        )}

        {/* Top-left lightweight craft label (subtle translucent slate, no noisy pill) */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 bg-[#0F171E]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded text-[11px] font-semibold border border-white/10">
          <Film className="w-3.5 h-3.5 text-[#F07818]" />
          <span>Časosběr stavby</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-slate-200">{video.durationLabel}</span>
        </div>

        {/* Center Play Overlay when not yet started or paused cleanly in showcase */}
        {(!hasStarted || !isPlaying) && !hasError && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={hasStarted ? 'Pokračovat v přehrávání videa' : 'Přehrát video ze staveniště'}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 hover:bg-black/25 transition-colors cursor-pointer group"
          >
            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F07818] group-hover:bg-[#d9660e] group-hover:scale-105 transition-all text-white flex items-center justify-center shadow-xl border-2 border-white/25">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5 fill-current" />
            </span>
            {!hasStarted && (
              <span className="mt-2.5 px-3 py-1 rounded bg-[#0F171E]/85 text-white text-xs font-bold shadow">
                Přehrát časosběr ({video.durationLabel})
              </span>
            )}
          </button>
        )}

        {/* Bottom Interactive Controls Bar */}
        {!hasError && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pt-6 pb-2.5 text-white ${
              compact ? 'pb-14' : ''
            }`}
          >
            {/* Progress Slider */}
            <input
              type="range"
              min={0}
              max={duration || 12}
              step={0.1}
              value={Math.min(currentTime, duration || 12)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              aria-label="Posuvník přehrávání videa"
              className="w-full h-1.5 mb-2 accent-[#F07818] cursor-pointer rounded-lg bg-white/25"
            />

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
                  aria-label={isPlaying ? 'Pozastavit' : 'Přehrát'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
                  title="Přehrát od začátku"
                  aria-label="Přehrát od začátku"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-200 whitespace-nowrap">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                {activeChapter && !compact && (
                  <span className="hidden sm:inline text-[11px] text-orange-300 font-medium truncate max-w-[210px]">
                    · {activeChapter.label.replace(/^\d+:\d+\s*/, '')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold font-mono transition-colors cursor-pointer"
                  title="Rychlost přehrávání"
                >
                  {playbackRate}×
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
                  title={isMuted ? 'Zapnout zvuk' : 'Ztlumit'}
                  aria-label={isMuted ? 'Zapnout zvuk' : 'Ztlumit'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="p-1.5 rounded hover:bg-white/15 transition-colors cursor-pointer"
                  title="Celá obrazovka"
                  aria-label="Celá obrazovka"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Navigation Row (Showcase Mode) */}
      {!compact && video.chapters && video.chapters.length > 0 && (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-[#17232D] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#F07818]" />
              <span>Kapitoly časosběru (kliknutím přeskočíte na fázi stavby):</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {video.chapters.map((chapter, idx) => {
              const isActive = idx === activeChapterIndex && hasStarted;
              return (
                <button
                  key={chapter.label}
                  type="button"
                  onClick={() => handleSeek(chapter.timeSec)}
                  className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#17232D] text-white border-[#17232D] shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div
                    className={`text-xs font-bold whitespace-nowrap ${
                      isActive ? 'text-[#F07818]' : 'text-[#17232D]'
                    }`}
                  >
                    {chapter.label}
                  </div>
                  {chapter.description && (
                    <p
                      className={`text-[11px] mt-0.5 line-clamp-2 leading-snug ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {chapter.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
