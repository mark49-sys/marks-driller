import React from 'react';
import { BrandLogo } from './BrandLogo.js';

export interface BrandLoaderProps {
  mode?: 'fullscreen' | 'contained' | 'inline';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * MarkDriller Production Pro Max Brand Loader
 * Displays the glowing full official brand insignia, MarkDriller typography,
 * CBT PLATFORM subtitle, "Drill down. Hit the mark." tagline, and status progress.
 */
export const BrandLoader: React.FC<BrandLoaderProps> = ({
  mode = 'contained',
  message = 'Loading MarkDriller...',
  size = 'md',
  className = '',
}) => {
  const isFullscreen = mode === 'fullscreen';
  const isInline = mode === 'inline';

  if (isInline) {
    return (
      <span
        className={`brand-loader-inline ${className}`}
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
        }}
      >
        <BrandLogo size="sm" variant="icon-only" glow={true} />
        {message && <span style={{ fontWeight: 600 }}>{message}</span>}
      </span>
    );
  }

  const logoSize = size === 'sm' ? 'md' : size === 'lg' || isFullscreen ? 'xl' : 'lg';

  return (
    <div
      className={`brand-loader-pro-container ${isFullscreen ? 'brand-loader-pro-fullscreen' : 'brand-loader-pro-contained'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="brand-loader-pro-card">
        {/* Animated Brand Emblem & Full Typography Lockup */}
        <div className="brand-loader-animated-logo">
          <BrandLogo
            size={logoSize}
            variant="stacked"
            showWordmark={true}
            showSubtitle={true}
            showTagline={true}
            glow={true}
            theme={isFullscreen ? 'dark' : 'auto'}
          />
        </div>

        {/* Ambient Progress Sweep Track */}
        <div
          className="brand-loader-pro-track"
          style={{
            width: isFullscreen ? '220px' : '170px',
          }}
        >
          <div className="brand-loader-pro-bar" />
        </div>

        {/* Dynamic Contextual Status Message */}
        {message && (
          <div className="brand-loader-pro-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
