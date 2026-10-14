import React, { useEffect } from 'react';
import { usePwaInstallStore } from '../store/usePwaInstallStore.js';
import { PwaInstallModal } from '../components/PwaInstallModal.js';
import { PwaInstallBanner } from '../components/PwaInstallBanner.js';

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initPwaListeners = usePwaInstallStore((state) => state.initPwaListeners);

  useEffect(() => {
    const cleanup = initPwaListeners();
    return cleanup;
  }, [initPwaListeners]);

  return (
    <>
      {children}
      <PwaInstallBanner />
      <PwaInstallModal />
    </>
  );
};
