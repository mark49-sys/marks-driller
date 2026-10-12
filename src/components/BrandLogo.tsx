import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  showSubtitle?: boolean;
  showTagline?: boolean;
  showWordmark?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark' | 'auto';
}

// Diameter of the badge, typography sizing, and spacing
const sizeConfig = {
  sm: { badge: 36, font: '16px', subtitle: '9px', tagline: '10.5px', gap: '8px', ring: 2 },
  md: { badge: 46, font: '20px', subtitle: '10px', tagline: '11.5px', gap: '10px', ring: 2.5 },
  lg: { badge: 88, font: '28px', subtitle: '11px', tagline: '13px', gap: '14px', ring: 3 },
  xl: { badge: 130, font: '36px', subtitle: '12px', tagline: '15px', gap: '16px', ring: 3.5 },
};

// High-resolution responsive image sources for uncropped official artwork
const srcSetFor = (ext: 'webp' | 'png') =>
  [96, 192, 256, 512].map((w) => `/icons/logo-full-${w}.${ext} ${w}w`).join(', ');

/**
 * MarkDriller Canonical Brand Logo
 * Displays the full uncropped brand artwork with radiant gold trim and
 * high-definition typography for an ultra-premium UX/UI.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = false,
  showTagline = false,
  showWordmark = true,
  glow = false,
  className = '',
  style = {},
  theme = 'auto',
}) => {
  const config = sizeConfig[size] || sizeConfig.md;
  const isStacked = variant === 'stacked';
  const isIconOnly = variant === 'icon-only';

  const baseColor =
    theme === 'dark'
      ? '#ffffff'
      : theme === 'light'
      ? (style?.color || '#121826')
      : (style?.color || 'var(--brand-mark, var(--ink, #121826))');

  const badge = (
    <picture className="brand-logo-badge" style={{ display: 'inline-flex', flexShrink: 0 }}>
      <source type="image/webp" srcSet={srcSetFor('webp')} sizes={`${config.badge}px`} />
      <img
        className={`mark-icon brand-badge-pro ${glow ? 'brand-badge-glow' : ''}`}
        src={config.badge <= 48 ? '/icons/logo-full-192.png' : '/icons/logo-full-512.png'}
        srcSet={srcSetFor('png')}
        sizes={`${config.badge}px`}
        width={config.badge}
        height={config.badge}
        alt={isIconOnly || !showWordmark ? 'MarkDriller CBT Platform' : ''}
        decoding="async"
        draggable={false}
        style={{
          width: config.badge,
          height: config.badge,
          boxShadow: glow
            ? undefined
            : `0 0 0 ${config.ring}px #fbbf24, 0 4px 14px rgba(11, 70, 200, 0.45)`,
        }}
      />
    </picture>
  );

  if (isIconOnly || !showWordmark) {
    return (
      <div
        className={`brand-logo-pro ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      >
        {badge}
      </div>
    );
  }

  return (
    <div
      className={`brand-logo-pro ${isStacked ? 'brand-logo-pro--stacked' : 'brand-logo-pro--horizontal'} ${className}`}
      style={{
        gap: config.gap,
        color: baseColor,
        ...style,
      }}
    >
      {badge}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isStacked ? 'center' : 'flex-start',
        }}
      >
        <div className="brand-title-pro" style={{ fontSize: config.font }}>
          <span className="mark-part" style={{ color: baseColor }}>Mark</span>
          <span className="driller-part">Driller</span>
        </div>

        {showSubtitle && (
          <span
            className="brand-subtitle-badge"
            style={{
              fontSize: config.subtitle,
            }}
          >
            CBT PLATFORM
          </span>
        )}

        {showTagline && (
          <span
            className="brand-tagline-pro"
            style={{
              fontSize: config.tagline,
              color: theme === 'dark' ? '#fbbf24' : 'var(--brand-drill, #c2410c)',
            }}
          >
            Drill down. Hit the mark.
          </span>
        )}
      </div>
    </div>
  );
};
