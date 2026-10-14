import { create } from 'zustand';

// BeforeInstallPromptEvent interface for browser compatibility
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PwaPlatform = 'ios' | 'android' | 'desktop' | 'other';

interface PwaInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isInstalled: boolean;
  canPromptDirectly: boolean;
  platform: PwaPlatform;
  isIosSafari: boolean;
  isBannerDismissed: boolean;
  instructionsModalOpen: boolean;

  // Actions
  initPwaListeners: () => () => void;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  triggerInstall: () => Promise<boolean>;
  openInstructions: () => void;
  closeInstructions: () => void;
  dismissBanner: () => void;
  resetDismissed: () => void;
}

const DISMISS_STORAGE_KEY = 'md_pwa_banner_dismissed_at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days cooldown after explicit dismissal

function detectPlatform(): { platform: PwaPlatform; isIosSafari: boolean } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { platform: 'other', isIosSafari: false };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isIosSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);

  if (isIOS) return { platform: 'ios', isIosSafari };
  if (isAndroid) return { platform: 'android', isIosSafari: false };

  const isDesktop = !/Mobi|Android|Tablet|iPad|iPhone/i.test(ua);
  return { platform: isDesktop ? 'desktop' : 'other', isIosSafari: false };
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const displayModeOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
  const displayModeMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
  const androidReferrer = document.referrer?.startsWith('android-app://') || false;

  return displayModeStandalone || displayModeOverlay || displayModeMinimalUi || iosStandalone || androidReferrer;
}

function checkIsBannerDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export const usePwaInstallStore = create<PwaInstallState>((set, get) => {
  const { platform, isIosSafari } = detectPlatform();
  const isStandalone = checkIsStandalone();

  return {
    deferredPrompt: null,
    isStandalone,
    isInstalled: isStandalone,
    canPromptDirectly: false,
    platform,
    isIosSafari,
    isBannerDismissed: checkIsBannerDismissed(),
    instructionsModalOpen: false,

    initPwaListeners: () => {
      if (typeof window === 'undefined') return () => {};

      // 1. Listen for standard PWA beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent default mini-infobar on mobile Chrome
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        set({
          deferredPrompt: promptEvent,
          canPromptDirectly: true,
          isInstalled: false,
        });
      };

      // 2. Listen for appinstalled
      const handleAppInstalled = () => {
        set({
          deferredPrompt: null,
          canPromptDirectly: false,
          isInstalled: true,
          isStandalone: true,
          instructionsModalOpen: false,
        });
        try {
          localStorage.removeItem(DISMISS_STORAGE_KEY);
        } catch {}
      };

      // 3. Listen for display-mode changes (e.g. user opens standalone window)
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handleDisplayModeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          set({ isStandalone: true, isInstalled: true });
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery?.addEventListener) {
        mediaQuery.addEventListener('change', handleDisplayModeChange);
      }

      // Cleanup
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        if (mediaQuery?.removeEventListener) {
          mediaQuery.removeEventListener('change', handleDisplayModeChange);
        }
      };
    },

    setDeferredPrompt: (prompt) => {
      set({
        deferredPrompt: prompt,
        canPromptDirectly: !!prompt,
      });
    },

    triggerInstall: async () => {
      const { deferredPrompt, isStandalone } = get();

      if (isStandalone) {
        return false;
      }

      // If browser provides native install prompt (Chrome, Edge, Samsung Internet)
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            set({
              isInstalled: true,
              deferredPrompt: null,
              canPromptDirectly: false,
              instructionsModalOpen: false,
            });
            return true;
          } else {
            // User cancelled the browser prompt
            return false;
          }
        } catch (err) {
          console.warn('[PWA] Prompt error:', err);
          // Fall back to opening instructions
          set({ instructionsModalOpen: true });
          return false;
        }
      }

      // If no native prompt available (iOS Safari, Firefox, or unsupported environment)
      set({ instructionsModalOpen: true });
      return false;
    },

    openInstructions: () => set({ instructionsModalOpen: true }),
    closeInstructions: () => set({ instructionsModalOpen: false }),

    dismissBanner: () => {
      set({ isBannerDismissed: true });
      try {
        localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
      } catch {}
    },

    resetDismissed: () => {
      set({ isBannerDismissed: false });
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {}
    },
  };
});
