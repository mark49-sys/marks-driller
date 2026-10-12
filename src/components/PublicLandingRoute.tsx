import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { LandingPage } from './LandingPage.js';
import { BrandLoader } from './BrandLoader.js';

export const PublicLandingRoute: React.FC = () => {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    // If redirected here with openLogin or openSignup state, open appropriate modal
    if (location.state && (location.state as any).openLogin && !isAuthenticated) {
      openAuthModal('login');
      // Clear state so modal doesn't re-open unexpectedly on subsequent interactions
      window.history.replaceState({}, document.title);
    } else if (location.state && (location.state as any).openSignup && !isAuthenticated) {
      openAuthModal('signup');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isAuthenticated, openAuthModal]);

  // Loading barrier while auth session rehydrates
  if (!isInitialized) {
    return <BrandLoader mode="fullscreen" message="Loading MarkDriller..." />;
  }

  // If already authenticated and verified, redirect directly into the respective dashboard
  if (isAuthenticated && user && user.isVerified) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Unauthenticated visitor or unverified account visiting root -> Public Landing Page
  return <LandingPage />;
};

