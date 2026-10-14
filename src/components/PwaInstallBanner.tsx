import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePwaInstallStore } from '../store/usePwaInstallStore.js';
import { BrandLogo } from './BrandLogo.js';

export const PwaInstallBanner: React.FC = () => {
  const { isStandalone, isInstalled, isBannerDismissed, triggerInstall, dismissBanner } = usePwaInstallStore();
  const location = useLocation();

  // 1. Do NOT display inside active CBT exam room
  if (location.pathname.startsWith('/cbt-exam') || location.pathname.startsWith('/exam-room')) {
    return null;
  }

  // 2. Do NOT display if running in standalone mode or already verified installed
  if (isStandalone || isInstalled) {
    return null;
  }

  // 3. Do NOT display if explicitly dismissed by user within cooldown window
  if (isBannerDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  return (
    <aside
      aria-label="App installation banner"
      className="pwa-install-banner"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        left: '16px',
        maxWidth: '380px',
        width: 'calc(100vw - 32px)',
        backgroundColor: 'var(--white, #ffffff)',
        border: '1.5px solid var(--paper-line)',
        borderRadius: '14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22)',
        zIndex: 9980,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideUp 0.25s ease',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <BrandLogo size="sm" />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--ink, #121826)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Install MarkDriller App
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Offline CBT practice & instant launch
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleInstallClick}
          className="btn-custom btn-custom-primary"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Install
        </button>

        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss install banner"
          title="Not now"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-soft)',
            fontSize: '16px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            borderRadius: '50%',
          }}
        >
          ✕
        </button>
      </div>
    </aside>
  );
};
