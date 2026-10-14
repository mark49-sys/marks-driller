import React, { useEffect } from 'react';
import { usePwaInstallStore } from '../store/usePwaInstallStore.js';
import { BrandLogo } from './BrandLogo.js';

export const PwaInstallModal: React.FC = () => {
  const { instructionsModalOpen, closeInstructions, platform, isIosSafari } = usePwaInstallStore();

  useEffect(() => {
    if (!instructionsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeInstructions();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [instructionsModalOpen, closeInstructions]);

  if (!instructionsModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="pwa-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeInstructions();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 44, 0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="pwa-modal-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--white, #ffffff)',
          border: '1.5px solid var(--paper-line)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 32px)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--paper-line)',
            backgroundColor: 'var(--paper, #f6f8fc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <BrandLogo size="sm" />
            <div style={{ minWidth: 0 }}>
              <h2
                id="pwa-install-title"
                style={{
                  fontSize: '15.5px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--ink, #121826)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.25,
                }}
              >
                Install MarkDriller App
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                Instant Access • Fullscreen • Zero App Store Downloads
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeInstructions}
            aria-label="Close install instructions"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--paper-line)',
              backgroundColor: 'var(--white)',
              color: 'var(--ink)',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {isIosSafari || platform === 'ios' ? (
            // iOS Safari Step-by-Step Instructions
            <div>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(32, 47, 128, 0.08)',
                  border: '1px solid rgba(32, 47, 128, 0.18)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  lineHeight: 1.45,
                }}
              >
                📱 <strong>iOS Safari Setup:</strong> Apple requires adding web applications to your Home Screen directly from Safari's menu.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Tap the <strong>Share button</strong> in Safari's bottom toolbar (the square icon with an arrow pointing up: <span style={{ fontSize: '15px' }}>⎋</span>).
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Scroll down through the share actions and tap <strong>"Add to Home Screen"</strong> (<span style={{ fontSize: '15px' }}>⊞</span>).
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Tap <strong>"Add"</strong> in the top-right corner. The official <strong>MarkDriller</strong> app icon will appear on your Home Screen!
                  </div>
                </div>
              </div>
            </div>
          ) : platform === 'android' ? (
            // Android Firefox / Other browser instructions
            <div>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(32, 47, 128, 0.08)',
                  border: '1px solid rgba(32, 47, 128, 0.18)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  lineHeight: 1.45,
                }}
              >
                🤖 <strong>Android Installation:</strong> Install MarkDriller to your app drawer for instant offline past question practice.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Tap the <strong>browser menu (⋮)</strong> in the top right or bottom corner.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop / Laptop instructions
            <div>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(32, 47, 128, 0.08)',
                  border: '1px solid rgba(32, 47, 128, 0.18)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: 'var(--ink)',
                  lineHeight: 1.45,
                }}
              >
                💻 <strong>Desktop Installation:</strong> Run MarkDriller as a standalone desktop app with dedicated window controls.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Click the <strong>Install icon (⊕)</strong> located on the right side of your browser address bar.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary, #202f80)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }}>
                    Confirm by clicking <strong>"Install"</strong> in the prompt. MarkDriller will launch in its own distraction-free window!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits summary list */}
          <div
            style={{
              marginTop: '8px',
              padding: '12px 14px',
              backgroundColor: 'var(--paper, #f6f8fc)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--ink-soft)',
            }}
          >
            <div>⚡ <strong>High Speed:</strong> Instant launch without browser tabs.</div>
            <div>📶 <strong>Offline Ready:</strong> Question bank and CBT practice persist offline.</div>
            <div>💾 <strong>Lightweight:</strong> Less than 2MB storage, saves your mobile data.</div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--paper-line)',
            backgroundColor: 'var(--paper, #f6f8fc)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn-custom btn-custom-primary"
            onClick={closeInstructions}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
