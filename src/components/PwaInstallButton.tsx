import React from 'react';
import { usePwaInstallStore } from '../store/usePwaInstallStore.js';

interface PwaInstallButtonProps {
  variant?: 'header' | 'drawer' | 'banner';
  className?: string;
  style?: React.CSSProperties;
  onClickExtra?: () => void;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  variant = 'header',
  className = '',
  style = {},
  onClickExtra,
}) => {
  const { isStandalone, isInstalled, triggerInstall } = usePwaInstallStore();

  // If already running in standalone PWA or verified installed, hide button
  if (isStandalone || isInstalled) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClickExtra) onClickExtra();
    await triggerInstall();
  };

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(32, 47, 128, 0.08)',
          border: '1px solid rgba(32, 47, 128, 0.22)',
          color: 'var(--color-primary, #202f80)',
          fontWeight: 700,
          fontSize: '13.5px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          ...style,
        }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>📲</span>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ lineHeight: 1.2 }}>Install App</span>
          <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--ink-soft)' }}>
            Instant offline access & full screen
          </span>
        </div>
      </button>
    );
  }

  // Default 'header' compact button
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`pwa-install-header-btn ${className}`}
      aria-label="Install MarkDriller Application"
      title="Install MarkDriller App on your device"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 11px',
        borderRadius: '20px',
        backgroundColor: 'var(--forest-soft, rgba(15, 118, 110, 0.1))',
        border: '1px solid var(--forest, #0f766e)',
        color: 'var(--forest, #0f766e)',
        fontSize: '12.5px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1 }}>📲</span>
      <span className="pwa-install-btn-text">Install App</span>
    </button>
  );
};
