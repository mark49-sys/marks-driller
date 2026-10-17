import React, { useRef, useEffect } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLogo } from './BrandLogo.js';
import { ThemeToggle } from './ThemeToggle.js';
import { PwaInstallButton } from './PwaInstallButton.js';

export const Navbar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen, openAuthModal } = useAppStore();
  const { user, isAuthenticated, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const pendingScrollRef = useRef<string | null>(null);

  const releaseScrollLock = () => {
    document.body.classList.remove('modal-open', 'offcanvas-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
  };

  const handleNavClick = () => {
    pendingScrollRef.current = null;
    setMobileMenuOpen(false);
    releaseScrollLock();
  };

  const handleLogout = () => {
    clearSession();
    handleNavClick();
    navigate('/');
  };

  const resolveTargetElement = (sectionId: string): HTMLElement | null => {
    let el = document.getElementById(sectionId);
    if (!el) {
      if (sectionId === 'examinations' || sectionId === 'exam-boards') {
        el = document.getElementById('exam-boards') || document.getElementById('examinations');
      } else if (sectionId === 'pricing' || sectionId === 'pricing-preview') {
        el = document.getElementById('pricing-preview') || document.getElementById('pricing');
      }
    }
    return el;
  };

  const executeScrollToElement = (target: HTMLElement) => {
    const navHeader = document.querySelector('header.site-header') as HTMLElement | null;
    const headerHeight = navHeader ? navHeader.getBoundingClientRect().height : 80;
    const rect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = Math.max(0, rect.top + scrollTop - headerHeight - 16);

    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    try {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    } catch {
      // Ignore focus errors
    }
  };

  const scrollToSection = (sectionId: string) => {
    releaseScrollLock();

    const el = resolveTargetElement(sectionId);
    if (el && location.pathname === '/') {
      executeScrollToElement(el);
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
      let attempts = 0;
      const pollTimer = setInterval(() => {
        attempts++;
        const target = resolveTargetElement(sectionId);
        if (target) {
          clearInterval(pollTimer);
          executeScrollToElement(target);
        } else if (attempts > 30) {
          clearInterval(pollTimer);
        }
      }, 50);
    }
  };

  const handleMobileNavScroll = (sectionId: string) => {
    releaseScrollLock();

    if (!mobileMenuOpen) {
      scrollToSection(sectionId);
      return;
    }

    pendingScrollRef.current = sectionId;
    setMobileMenuOpen(false);

    // Reliable fallback for environments where CSS transitions/onExited are suppressed
    setTimeout(() => {
      releaseScrollLock();
      if (pendingScrollRef.current === sectionId) {
        pendingScrollRef.current = null;
        scrollToSection(sectionId);
      }
    }, 320);
  };

  const handleDrawerExited = () => {
    releaseScrollLock();
    if (pendingScrollRef.current) {
      const targetId = pendingScrollRef.current;
      pendingScrollRef.current = null;
      scrollToSection(targetId);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) {
        setMobileMenuOpen(false);
        releaseScrollLock();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      releaseScrollLock();
    };
  }, [setMobileMenuOpen]);

  return (
    <header
      className="site-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1020,
        width: '100%',
      }}
    >
      <nav className="wrap nav-container site-header__inner">
        <Link to="/" className="logo" aria-label="Mark Driller home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <BrandLogo size="md" />
        </Link>

        {/* Middle & Right: Unified Desktop Row (Reference Layout) */}
        <div className="nav-desktop-group">
          <div className="nav-links">
            {isAuthenticated && (
              <Link to="/dashboard" style={{ color: 'var(--rust)', fontWeight: 700 }}>
                📊 Dashboard
              </Link>
            )}
            <button
              type="button"
              id="desktop-nav-examinations"
              className="nav-link-btn"
              onClick={() => scrollToSection('exam-boards')}
            >
              Examinations
            </button>
            <button
              type="button"
              id="desktop-nav-quick-start"
              className="nav-link-btn"
              onClick={() => scrollToSection('quick-start')}
            >
              Quick Start
            </button>
            <button
              type="button"
              id="desktop-nav-how-it-works"
              className="nav-link-btn"
              onClick={() => scrollToSection('how-it-works')}
            >
              How It Works
            </button>
            <button
              type="button"
              id="desktop-nav-benefits"
              className="nav-link-btn"
              onClick={() => scrollToSection('benefits')}
            >
              Benefits
            </button>
            <button
              type="button"
              id="desktop-nav-pricing"
              className="nav-link-btn"
              onClick={() => scrollToSection('pricing-preview')}
            >
              Pricing
            </button>
            {!isAuthenticated && (
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => openAuthModal('login')}
              >
                Log In
              </button>
            )}
          </div>

          <div className="nav-auth-group">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.role === 'ADMIN' ? (
                  <Link
                    to="/admin"
                    className="btn-custom btn-custom-primary nav-btn-compact"
                  >
                    🛡️ Admin Portal
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="btn-custom btn-custom-ghost nav-btn-compact"
                  >
                    👤 {user.fullName ? user.fullName.split(' ')[0] : 'Student'}
                  </Link>
                )}
                <button
                  type="button"
                  className="nav-login"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-custom btn-custom-primary nav-btn-compact"
                  onClick={() => openAuthModal('signup')}
                >
                  Get started
                </button>
              </div>
            )}
            {/* PWA Desktop Install Action */}
            <PwaInstallButton variant="header" style={{ marginRight: '4px' }} />
          </div>

          {/* Far Right: Existing Theme Toggle */}
          <div className="nav-theme-slot" aria-label="Theme switcher">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile & Tablet Controls */}
        <div className="nav-mobile-controls">
          {!isAuthenticated && (
            <button
              type="button"
              className="btn-custom btn-custom-primary nav-btn-compact nav-mobile-cta"
              onClick={() => openAuthModal('signup')}
            >
              Get started
            </button>
          )}
          <ThemeToggle />
          <button
            type="button"
            className="menu-toggle-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-drawer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect y="3" width="20" height="2.2" rx="1.1" fill="currentColor" />
              <rect y="8.9" width="20" height="2.2" rx="1.1" fill="currentColor" />
              <rect y="14.8" width="20" height="2.2" rx="1.1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Offcanvas Navigation */}
      <Offcanvas
        id="public-mobile-drawer"
        show={mobileMenuOpen}
        restoreFocus={false}
        restoreFocusOptions={{ preventScroll: true }}
        onHide={() => {
          pendingScrollRef.current = null;
          setMobileMenuOpen(false);
          releaseScrollLock();
        }}
        onExited={handleDrawerExited}
        placement="end"
        className="mobile-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <BrandLogo size="sm" />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--paper-line)' }}>
            <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
              Appearance
            </span>
            <ThemeToggle showLabel />
          </div>

          {/* PWA Mobile App Install Action */}
          <div style={{ marginBottom: '16px' }}>
            <PwaInstallButton variant="drawer" onClickExtra={handleNavClick} />
          </div>

          {!isAuthenticated && (
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  handleNavClick();
                  openAuthModal('signup');
                }}
              >
                Get started
              </button>
            </div>
          )}

          <div className="mobile-nav-links">
            {isAuthenticated && (
              <Link to="/dashboard" onClick={handleNavClick} style={{ color: 'var(--rust)', fontWeight: 700 }}>
                📊 Student Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={handleNavClick} style={{ color: 'var(--ink)', fontWeight: 700 }}>
                🛡️ Admin Portal
              </Link>
            )}
            <button
              type="button"
              id="mobile-nav-examinations"
              className="mobile-nav-link-btn"
              onClick={() => handleMobileNavScroll('exam-boards')}
            >
              Examinations
            </button>
            <button
              type="button"
              id="mobile-nav-quick-start"
              className="mobile-nav-link-btn"
              onClick={() => handleMobileNavScroll('quick-start')}
            >
              Quick Start
            </button>
            <button
              type="button"
              id="mobile-nav-how-it-works"
              className="mobile-nav-link-btn"
              onClick={() => handleMobileNavScroll('how-it-works')}
            >
              How It Works
            </button>
            <button
              type="button"
              id="mobile-nav-benefits"
              className="mobile-nav-link-btn"
              onClick={() => handleMobileNavScroll('benefits')}
            >
              Benefits
            </button>
            <button
              type="button"
              id="mobile-nav-pricing"
              className="mobile-nav-link-btn"
              onClick={() => handleMobileNavScroll('pricing-preview')}
            >
              Pricing
            </button>
            {!isAuthenticated && (
              <button
                type="button"
                className="mobile-nav-link-btn"
                onClick={() => {
                  handleNavClick();
                  openAuthModal('login');
                }}
              >
                Log In
              </button>
            )}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isAuthenticated ? (
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleLogout}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  handleNavClick();
                  openAuthModal('login');
                }}
              >
                Log In
              </button>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
};


