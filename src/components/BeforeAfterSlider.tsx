import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'PŘED ZÁSAHEM',
  afterLabel = 'PO REKONSTRUKCI',
  title,
  subtitle,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver: keeps containerWidth accurately measured across all mobile resolutions and orientation changes
  useEffect(() => {
    if (!containerRef.current) return;

    const measureWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    measureWidth();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', measureWidth);
    window.addEventListener('orientationchange', measureWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureWidth);
      window.removeEventListener('orientationchange', measureWidth);
    };
  }, []);

  // Calculate percentage from clientX
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Global window listeners while dragging to ensure smooth dragging even if finger leaves container
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      updatePosition(e.clientX);
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX);
      }
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, [isDragging, updatePosition]);

  // Pointer event handlers on container
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary touch/button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    updatePosition(e.clientX);
    if (containerRef.current) {
      try {
        containerRef.current.setPointerCapture(e.pointerId);
      } catch {
        // ignore if not supported
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Direct touch handlers for older mobile browsers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    }
  };

  // Keyboard accessibility (Arrows ±5%, Shift+Arrows ±1%, PageUp/PageDown ±10%, Home/End)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 5;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + step));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 10));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  };

  const roundedPosition = Math.round(sliderPosition);

  return (
    <div className={`space-y-3 ${className}`}>
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-2">
          {title && <h4 className="text-base font-extrabold text-[#17232D]">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        </div>
      )}

      {/* Main Interactive Slider Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={roundedPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${roundedPosition} procent před rekonstrukcí, ${100 - roundedPosition} procent po rekonstrukci`}
        aria-label="Interaktivní posuvník srovnání před a po rekonstrukci"
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden select-none touch-none cursor-ew-resize border border-slate-300 shadow-md group outline-none focus-visible:ring-2 focus-visible:ring-[#C2560A]"
        style={{ WebkitUserSelect: 'none', touchAction: 'none' }}
      >
        {/* AFTER IMAGE (Bottom Layer - full width) */}
        <ResponsiveImage
          src={afterImage}
          alt={afterLabel}
          sizes="(max-width: 1024px) 100vw, 1152px"
          defaultWidth={1200}
          defaultHeight={896}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />

        {/* AFTER BADGE (Right) */}
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-[#17232D]/85 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md border border-white/20 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3 h-3 text-[#F07818]" />
          <span>{afterLabel}</span>
        </div>

        {/* BEFORE IMAGE (Top Layer - clipped to sliderPosition) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none select-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <ResponsiveImage
            src={beforeImage}
            alt={beforeLabel}
            sizes="(max-width: 1024px) 100vw, 1152px"
            defaultWidth={1376}
            defaultHeight={768}
            draggable={false}
            className="absolute inset-0 h-full object-cover select-none"
            style={{
              width: containerWidth > 0 ? `${containerWidth}px` : '100%',
              maxWidth: 'none',
            }}
          />
        </div>

        {/* BEFORE BADGE (Left) */}
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md border border-white/20 shadow-sm pointer-events-none"
          style={{ opacity: sliderPosition < 15 ? 0 : 1, transition: 'opacity 0.2s' }}
        >
          <span>{beforeLabel}</span>
        </div>

        {/* SLIDER DIVIDER LINE */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* DRAG HANDLE BUTTON - 44px touch target on mobile */}
          <div
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 sm:w-11 sm:h-11 rounded-full bg-[#C2560A] text-white flex items-center justify-center shadow-2xl border-2 border-white pointer-events-auto transition-transform ${
              isDragging ? 'scale-110 ring-4 ring-[#C2560A]/40' : 'group-hover:scale-105 active:scale-95'
            }`}
            style={{ touchAction: 'none' }}
          >
            <MoveHorizontal className="w-5 h-5 drop-shadow-xs" />
          </div>
        </div>

        {/* HINT OVERLAY (Disappears on hover/drag) */}
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-3.5 py-1.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold rounded-full transition-opacity ${
            isDragging ? 'opacity-0' : 'opacity-85 group-hover:opacity-0'
          }`}
        >
          Tažením prstu nebo myši porovnejte
        </div>
      </div>

      {/* MOBILE QUICK PRESET BUTTONS (Accessible & fast on mobile) */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 px-1">
        <button
          type="button"
          onClick={() => setSliderPosition(100)}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            sliderPosition > 85 ? 'text-[#B84F00] font-bold bg-orange-50' : 'hover:text-slate-900'
          }`}
        >
          ← 100% PŘED
        </button>

        <button
          type="button"
          onClick={() => setSliderPosition(50)}
          className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
            sliderPosition >= 45 && sliderPosition <= 55
              ? 'text-[#17232D] font-bold bg-slate-200'
              : 'hover:text-slate-900'
          }`}
        >
          Srovnání 50 / 50
        </button>

        <button
          type="button"
          onClick={() => setSliderPosition(0)}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            sliderPosition < 15 ? 'text-[#B84F00] font-bold bg-orange-50' : 'hover:text-slate-900'
          }`}
        >
          100% PO →
        </button>
      </div>
    </div>
  );
};
