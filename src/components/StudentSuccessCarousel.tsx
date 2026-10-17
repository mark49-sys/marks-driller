import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface AchieverImage {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const ACHIEVER_IMAGES: AchieverImage[] = [
  {
    id: 'achiever-370',
    src: '/assets/images/achievers/jamb-top-scorer-370.jpg',
    alt: 'NTIC Top JAMB Scorer - Score 370',
    width: 512,
    height: 449,
  },
  {
    id: 'achiever-369',
    src: '/assets/images/achievers/jamb-top-scorer-369.jpg',
    alt: 'JAMB Excellence Nationwide 3rd Best Score - 369',
    width: 409,
    height: 512,
  },
  {
    id: 'achiever-366',
    src: '/assets/images/achievers/jamb-top-scorer-366.jpg',
    alt: 'Bright Sun College JAMB Top Scorer - Score 366',
    width: 409,
    height: 512,
  },
  {
    id: 'achiever-359',
    src: '/assets/images/achievers/jamb-top-scorer-359.jpg',
    alt: 'NTIC Top JAMB Scorer - Score 359',
    width: 409,
    height: 512,
  },
  {
    id: 'achiever-374',
    src: '/assets/images/achievers/jamb-top-scorer-374.jpg',
    alt: 'The Ambassadors College UTME Champion - Score 374',
    width: 399,
    height: 501,
  },
  {
    id: 'achiever-337',
    src: '/assets/images/achievers/jamb-top-scorer-337.jpg',
    alt: 'NTIC Kano Girls Top JAMB Scorer - Score 337',
    width: 431,
    height: 512,
  },
  {
    id: 'achiever-331',
    src: '/assets/images/achievers/jamb-top-scorer-331.jpg',
    alt: 'NTIC Top JAMB Scorer - Score 331',
    width: 363,
    height: 512,
  },
];

export const StudentSuccessCarousel: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isAutoSlideBtnVisible, setIsAutoSlideBtnVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Touch gesture tracking for smooth mobile swiping
  const touchStartRef = useRef<number | null>(null);
  const touchDeltaRef = useRef<number>(0);

  // Detect user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Allow keyboard Escape to close revealed auto-slide button without scrolling page
  useEffect(() => {
    if (!isAutoSlideBtnVisible) return;
    const handleKeyDownEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutoSlideBtnVisible(false);
        triggerBtnRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', handleKeyDownEsc);
    return () => window.removeEventListener('keydown', handleKeyDownEsc);
  }, [isAutoSlideBtnVisible]);

  // Sync scroll state with active index
  const updateScrollState = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const children = Array.from(trackRef.current.children) as HTMLElement[];
    if (children.length === 0) return;

    let closestIdx = 0;
    let minDistance = Infinity;
    const containerLeft = trackRef.current.getBoundingClientRect().left;

    children.forEach((child, idx) => {
      const distance = Math.abs(child.getBoundingClientRect().left - containerLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    setActiveIndex(closestIdx);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener('scroll', updateScrollState, { passive: true });
    return () => track.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  // Programmatic scroll to specific slide index strictly within the carousel track (never scrolls window)
  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    const target = children[index];
    if (target) {
      const scrollPos = target.offsetLeft - track.offsetLeft;
      track.scrollTo({
        left: scrollPos >= 0 ? scrollPos : target.offsetLeft,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      setActiveIndex(index);
    }
  }, [prefersReducedMotion]);

  // Manual Previous / Next handlers
  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    } else {
      scrollToSlide(ACHIEVER_IMAGES.length - 1);
    }
  }, [activeIndex, scrollToSlide]);

  const handleNext = useCallback(() => {
    if (activeIndex < ACHIEVER_IMAGES.length - 1) {
      scrollToSlide(activeIndex + 1);
    } else {
      scrollToSlide(0);
    }
  }, [activeIndex, scrollToSlide]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Touch swipe events for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null) {
      touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaRef.current > 40) {
      handlePrev();
    } else if (touchDeltaRef.current < -40) {
      handleNext();
    }
    touchStartRef.current = null;
    touchDeltaRef.current = 0;
    setIsHovered(false);
  };

  // Automatic slideshow timer: runs every 6s when isAutoPlay is ON and user is not interacting
  useEffect(() => {
    if (!isAutoPlay || isHovered || prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      if (!trackRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 25) {
        trackRef.current.scrollTo({
          left: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        setActiveIndex(0);
      } else {
        handleNext();
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, prefersReducedMotion, handleNext]);

  const handleRevealAutoSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAutoSlideBtnVisible(true);
    requestAnimationFrame(() => {
      toggleBtnRef.current?.focus({ preventScroll: true });
    });
  };

  const handleToggleAutoSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget) {
      (e.currentTarget as HTMLElement).blur();
    }
    setIsAutoPlay((prev) => !prev);
    setIsAutoSlideBtnVisible(false);
    setTimeout(() => {
      triggerBtnRef.current?.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <section
      className="achiever-images-section"
      id="student-success-carousel"
      aria-labelledby="student-scores-heading"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="wrap achiever-images-container">
        {/* Section Heading & Slideshow Controls */}
        <div className="achiever-images-header">
          <h2 id="student-scores-heading" className="achiever-images-title">
            Big Goals. Better Preparation. Brighter Futures.
          </h2>

          <div className="achiever-carousel-actions" role="region" aria-label="Slideshow controls">
            {/* Automatic Slideshow Toggle: preserved in DOM without unmounting focus loss, controlled with preventScroll */}
            <button
              ref={triggerBtnRef}
              type="button"
              className="achiever-autoplay-trigger"
              style={{ display: !isAutoSlideBtnVisible ? 'inline-flex' : 'none' }}
              onClick={handleRevealAutoSlide}
              aria-label="Reveal auto-slide control"
              title="Click to reveal auto-slide control"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              <span className="autoplay-trigger-label">Auto-Slide</span>
            </button>

            <button
              ref={toggleBtnRef}
              type="button"
              className={`achiever-autoplay-btn ${isAutoPlay ? 'active' : ''}`}
              style={{ display: isAutoSlideBtnVisible ? 'inline-flex' : 'none' }}
              onClick={handleToggleAutoSlide}
              aria-label={isAutoPlay ? 'Turn automatic slides off' : 'Turn automatic slides on'}
              title={isAutoPlay ? 'Auto-Slide: ON (Click to turn off)' : 'Auto-Slide: OFF (Click to turn on)'}
            >
              <span className={`autoplay-indicator ${isAutoPlay ? 'on' : 'off'}`} aria-hidden="true" />
              <span className="autoplay-label">{isAutoPlay ? 'Auto-Slide: ON' : 'Auto-Slide: OFF'}</span>
            </button>

            {/* Prev / Next Controls */}
            <div className="achiever-nav-group">
              <button
                type="button"
                className="achiever-nav-arrow prev"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrev();
                }}
                disabled={!canScrollLeft && activeIndex === 0 && !isAutoPlay}
                aria-label="Previous slide"
                title="Previous slide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="achiever-nav-arrow next"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={!canScrollRight && activeIndex === ACHIEVER_IMAGES.length - 1 && !isAutoPlay}
                aria-label="Next slide"
                title="Next slide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Track — IMAGES ONLY */}
        <div
          ref={trackRef}
          className="achiever-images-track"
          tabIndex={0}
          role="region"
          aria-label="Student achievement score banners"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {ACHIEVER_IMAGES.map((item, idx) => (
            <div
              key={item.id}
              className={`achiever-image-slide ${idx === activeIndex ? 'is-active' : ''}`}
              style={item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
            >
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="achiever-banner-img"
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="achiever-dots" role="tablist" aria-label="Select slide">
          {ACHIEVER_IMAGES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Go to slide ${idx + 1}`}
              className={`achiever-dot ${idx === activeIndex ? 'is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollToSlide(idx);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentSuccessCarousel;
