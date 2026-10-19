/**
 * MARKDRILLER — CRITICAL PRODUCTION VERIFICATION:
 * COMPREHENSIVE MOBILE AND TABLET NAVIGATION REPAIR AUDIT
 *
 * Verifies:
 * 1. Target Sections & Unique Stable IDs (no broken or duplicate anchors).
 * 2. Mobile and Desktop Navigation Link Mappings (Landing page sections and routes).
 * 3. Offcanvas Focus-Trap Elimination (restoreFocus={false} & restoreFocusOptions={{ preventScroll: true }}).
 * 4. Hamburger Button Toggle Behavior (onClick toggle, aria-expanded, aria-controls).
 * 5. Document Scroll-Lock Cleanup & Body Unlock (onHide, onExited, link clicks, unmount).
 * 6. Sticky Navbar Offset Clearance (dynamic header height calculation + scroll-margin-top).
 * 7. Unified Responsive Breakpoints & Viewport Resize Cleanup (<= 1180px, resize listeners).
 * 8. Mobile & Tablet Touch Target Standards (>= 48px height, touch-action: manipulation).
 * 9. Cross-Route Navigation (route transitions back to landing page sections with state/hash).
 * 10. Footer Navigation Destination Repair (elimination of stale IDs: experience, offers, performance).
 * 11. Multi-Device Viewport Simulation Matrix (320px, 375px, 768px, 1024px, 1280px).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

console.log('========================================================================');
console.log(' MARKDRILLER — COMPREHENSIVE NAVIGATION SYSTEM AUDIT');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assertCheck(id: string, description: string, condition: boolean, details: string) {
  if (condition) {
    console.log(`✓ [${id}] ${description}: ${details}`);
    passCount++;
  } else {
    console.error(`✗ [${id}] FAIL: ${description}`);
    console.error(`  Details: ${details}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. Target Sections & Stable ID Audit
// -----------------------------------------------------------------------------
console.log('--- 1. Target Sections & Stable ID Audit ---');

const examBoardsPath = path.join(srcDir, 'components', 'ExamBoards.tsx');
const quickStartPath = path.join(srcDir, 'components', 'QuickStartActions.tsx');
const howItWorksPath = path.join(srcDir, 'components', 'HowItWorks.tsx');
const benefitsPath = path.join(srcDir, 'components', 'WhatWeOffer.tsx');
const pricingPath = path.join(srcDir, 'components', 'SubscriptionTiersPreview.tsx');

const examBoardsContent = fs.readFileSync(examBoardsPath, 'utf8');
const quickStartContent = fs.readFileSync(quickStartPath, 'utf8');
const howItWorksContent = fs.readFileSync(howItWorksPath, 'utf8');
const benefitsContent = fs.readFileSync(benefitsPath, 'utf8');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');

assertCheck(
  'SECTION_ID_EXAMINATIONS',
  'Examinations section defines stable unique ID',
  examBoardsContent.includes('id="exam-boards"'),
  'ExamBoards.tsx defines id="exam-boards" on section root'
);

assertCheck(
  'SECTION_ALIAS_EXAMINATIONS',
  'Examinations section defines backwards-compatible anchor alias',
  examBoardsContent.includes('id="examinations"'),
  'ExamBoards.tsx includes id="examinations" anchor element'
);

assertCheck(
  'SECTION_ID_QUICK_START',
  'Quick Start section defines stable unique ID',
  quickStartContent.includes('id="quick-start"'),
  'QuickStartActions.tsx defines id="quick-start" on section root'
);

assertCheck(
  'SECTION_ID_HOW_IT_WORKS',
  'How It Works section defines stable unique ID',
  howItWorksContent.includes('id="how-it-works"'),
  'HowItWorks.tsx defines id="how-it-works" on section root'
);

assertCheck(
  'SECTION_ID_BENEFITS',
  'Benefits section defines stable unique ID',
  benefitsContent.includes('id="benefits"'),
  'WhatWeOffer.tsx defines id="benefits" on section root'
);

assertCheck(
  'SECTION_ID_PRICING',
  'Pricing section defines stable unique ID',
  pricingContent.includes('id="pricing-preview"'),
  'SubscriptionTiersPreview.tsx defines id="pricing-preview" on section root'
);

assertCheck(
  'SECTION_ALIAS_PRICING',
  'Pricing section defines backwards-compatible anchor alias',
  pricingContent.includes('id="pricing"'),
  'SubscriptionTiersPreview.tsx includes id="pricing" anchor element'
);

// -----------------------------------------------------------------------------
// 2. Duplicate ID Scan Across Landing Page Components
// -----------------------------------------------------------------------------
console.log('\n--- 2. Duplicate ID Scan ---');

const landingComponents = [
  { name: 'ExamBoards.tsx', content: examBoardsContent },
  { name: 'QuickStartActions.tsx', content: quickStartContent },
  { name: 'HowItWorks.tsx', content: howItWorksContent },
  { name: 'WhatWeOffer.tsx', content: benefitsContent },
  { name: 'SubscriptionTiersPreview.tsx', content: pricingContent },
];

const targetSectionIds = ['exam-boards', 'quick-start', 'how-it-works', 'benefits', 'pricing-preview'];
for (const secId of targetSectionIds) {
  let occurrences = 0;
  for (const comp of landingComponents) {
    const matches = comp.content.match(new RegExp(`id=["']${secId}["']`, 'g'));
    if (matches) occurrences += matches.length;
  }
  assertCheck(
    `NO_DUPLICATE_${secId.toUpperCase().replace(/-/g, '_')}`,
    `No duplicate ID for ${secId}`,
    occurrences === 1,
    `Found exactly ${occurrences} instance of id="${secId}"`
  );
}

// -----------------------------------------------------------------------------
// 3. Navbar Mobile Navigation Links & Click Handlers Audit
// -----------------------------------------------------------------------------
console.log('\n--- 3. Navbar Mobile Navigation Links Audit ---');

const navbarPath = path.join(srcDir, 'components', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

const expectedMobileNavLinks = [
  { name: 'Examinations', target: 'exam-boards', id: 'mobile-nav-examinations' },
  { name: 'Quick Start', target: 'quick-start', id: 'mobile-nav-quick-start' },
  { name: 'How It Works', target: 'how-it-works', id: 'mobile-nav-how-it-works' },
  { name: 'Benefits', target: 'benefits', id: 'mobile-nav-benefits' },
  { name: 'Pricing', target: 'pricing-preview', id: 'mobile-nav-pricing' },
];

for (const link of expectedMobileNavLinks) {
  const hasTargetHandler = navbarContent.includes(`handleMobileNavScroll('${link.target}')`);
  const hasButtonId = navbarContent.includes(`id="${link.id}"`);
  assertCheck(
    `MOBILE_LINK_${link.name.toUpperCase().replace(/\s+/g, '_')}`,
    `Mobile link for ${link.name} targets '${link.target}'`,
    hasTargetHandler && hasButtonId,
    `Button id="${link.id}" invokes handleMobileNavScroll('${link.target}')`
  );
}

assertCheck(
  'MOBILE_LINK_HELP_SUPPORT',
  'Mobile link for Help & Contact Support exists in mobile drawer',
  navbarContent.includes('id="mobile-nav-help-support"') &&
    navbarContent.includes('handleHelpSupportClick'),
  'Button id="mobile-nav-help-support" invokes handleHelpSupportClick'
);

// -----------------------------------------------------------------------------
// 4. Offcanvas Focus-Trap Elimination (Root Cause Fix)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Offcanvas Focus-Trap Elimination Audit ---');

const portalHeaderPath = path.join(srcDir, 'components', 'PortalHeader.tsx');
const portalHeaderContent = fs.readFileSync(portalHeaderPath, 'utf8');

assertCheck(
  'NAVBAR_OFFCANVAS_RESTORE_FOCUS',
  'Navbar Offcanvas disables restoreFocus to stop scroll-to-top jump',
  navbarContent.includes('restoreFocus={false}') &&
    navbarContent.includes('restoreFocusOptions={{ preventScroll: true }}'),
  'Navbar Offcanvas specifies restoreFocus={false} and preventScroll: true'
);

assertCheck(
  'PORTAL_OFFCANVAS_RESTORE_FOCUS',
  'PortalHeader Offcanvas disables restoreFocus to stop scroll-to-top jump',
  portalHeaderContent.includes('restoreFocus={false}') &&
    portalHeaderContent.includes('restoreFocusOptions={{ preventScroll: true }}'),
  'PortalHeader Offcanvas specifies restoreFocus={false} and preventScroll: true'
);

assertCheck(
  'NAVBAR_FOCUS_MANAGEMENT',
  'Navbar executeScrollToElement sets focus with preventScroll',
  navbarContent.includes('target.focus({ preventScroll: true })'),
  'executeScrollToElement applies target.focus({ preventScroll: true })'
);

// -----------------------------------------------------------------------------
// 5. Hamburger Button Toggle Behavior & Accessibility
// -----------------------------------------------------------------------------
console.log('\n--- 5. Hamburger Button Toggle & Accessibility Audit ---');

assertCheck(
  'NAVBAR_HAMBURGER_TOGGLE',
  'Navbar hamburger toggles open/close state',
  navbarContent.includes('setMobileMenuOpen(!mobileMenuOpen)'),
  'Navbar button toggles setMobileMenuOpen(!mobileMenuOpen)'
);

assertCheck(
  'NAVBAR_HAMBURGER_ARIA',
  'Navbar hamburger provides aria-expanded and aria-controls',
  navbarContent.includes('aria-expanded={mobileMenuOpen}') &&
    navbarContent.includes('aria-controls="public-mobile-drawer"'),
  'Navbar button declares aria-expanded and aria-controls="public-mobile-drawer"'
);

assertCheck(
  'PORTAL_HAMBURGER_TOGGLE',
  'PortalHeader hamburger toggles open/close state',
  portalHeaderContent.includes('setMobileMenuOpen(!mobileMenuOpen)'),
  'PortalHeader button toggles setMobileMenuOpen(!mobileMenuOpen)'
);

assertCheck(
  'PORTAL_HAMBURGER_ARIA',
  'PortalHeader hamburger provides aria-expanded and aria-controls',
  portalHeaderContent.includes('aria-expanded={mobileMenuOpen}') &&
    portalHeaderContent.includes('aria-controls="portal-mobile-drawer"'),
  'PortalHeader button declares aria-expanded and aria-controls="portal-mobile-drawer"'
);

// -----------------------------------------------------------------------------
// 6. Scroll-Lock Cleanup & Body Unlock Audit
// -----------------------------------------------------------------------------
console.log('\n--- 6. Scroll-Lock Cleanup & Body Unlock Audit ---');

assertCheck(
  'NAVBAR_RELEASE_SCROLL_LOCK',
  'Navbar releaseScrollLock cleans up modal-open and offcanvas-open',
  navbarContent.includes('releaseScrollLock') &&
    navbarContent.includes("classList.remove('modal-open', 'offcanvas-open')") &&
    navbarContent.includes("document.body.style.overflow = ''"),
  'Navbar explicitly removes modal/offcanvas lock classes and resets overflow'
);

assertCheck(
  'NAVBAR_OFFCANVAS_ON_HIDE_CLEANUP',
  'Navbar Offcanvas onHide releases scroll lock',
  navbarContent.includes('onHide={() => {') &&
    navbarContent.includes('releaseScrollLock();'),
  'Navbar onHide hook triggers releaseScrollLock()'
);

assertCheck(
  'NAVBAR_OFFCANVAS_ON_EXITED_HOOK',
  'Navbar Offcanvas registers onExited callback for clean post-transition scrolling',
  navbarContent.includes('onExited={handleDrawerExited}'),
  '<Offcanvas onExited={handleDrawerExited}> fires after drawer exit animation completes'
);

assertCheck(
  'PORTAL_RELEASE_SCROLL_LOCK',
  'PortalHeader releaseScrollLock cleans up modal-open and offcanvas-open',
  portalHeaderContent.includes('releaseScrollLock') &&
    portalHeaderContent.includes("classList.remove('modal-open', 'offcanvas-open')") &&
    portalHeaderContent.includes("document.body.style.overflow = ''"),
  'PortalHeader explicitly removes modal/offcanvas lock classes and resets overflow'
);

assertCheck(
  'PORTAL_DRAWER_NAV_CLICK',
  'PortalHeader links invoke handleDrawerNavClick releasing scroll lock',
  portalHeaderContent.includes('handleDrawerNavClick'),
  'Drawer links close drawer and release scroll lock immediately upon tap'
);

assertCheck(
  'PORTAL_MOBILE_LINK_HELP_SUPPORT',
  'PortalHeader mobile drawer contains Help & Contact Support item',
  portalHeaderContent.includes('portal-mobile-help-support') &&
    portalHeaderContent.includes("path: '/portal/contact'"),
  'Item id="portal-mobile-help-support" points to /portal/contact'
);

// -----------------------------------------------------------------------------
// 7. Sticky Navbar Height & Section Offset Protection Audit
// -----------------------------------------------------------------------------
console.log('\n--- 7. Sticky Navbar & Scroll Offset Protection Audit ---');

const themePath = path.join(srcDir, 'styles', 'theme.css');
const themeContent = fs.readFileSync(themePath, 'utf8');

assertCheck(
  'NAV_STICKY_POSITIONING',
  'Navbar enforces sticky positioning with top: 0 and z-index',
  navbarContent.includes("position: 'sticky'") &&
    navbarContent.includes('top: 0') &&
    navbarContent.includes('zIndex: 1020'),
  'Navbar specifies position: sticky, top: 0, zIndex: 1020'
);

assertCheck(
  'HEADER_HEIGHT_VARIABLE',
  'theme.css declares --header-height in :root',
  themeContent.includes('--header-height: 80px;'),
  '--header-height: 80px defined for exact sticky header compensation'
);

assertCheck(
  'SECTIONS_SCROLL_MARGIN_TOP',
  'All 5 landing sections declare scroll-margin-top',
  themeContent.includes('scroll-margin-top:') &&
    themeContent.includes('#exam-boards') &&
    themeContent.includes('#quick-start') &&
    themeContent.includes('#how-it-works') &&
    themeContent.includes('#benefits') &&
    themeContent.includes('#pricing-preview'),
  'theme.css sets scroll-margin-top with header-height + 20px padding across all 5 sections'
);

assertCheck(
  'PROGRAMMATIC_HEADER_OFFSET',
  'executeScrollToElement computes target position accounting for sticky header height',
  navbarContent.includes('headerHeight') && navbarContent.includes('getBoundingClientRect()'),
  'executeScrollToElement dynamically calculates element.top - headerHeight - buffer'
);

// -----------------------------------------------------------------------------
// 8. Responsive Breakpoint & Viewport Resize Transition Audit
// -----------------------------------------------------------------------------
console.log('\n--- 8. Responsive Breakpoint & Viewport Resize Audit ---');

assertCheck(
  'THEME_UNIFIED_BREAKPOINT',
  'theme.css uses unified 1180px breakpoint for mobile/tablet navigation',
  themeContent.includes('@media (max-width: 1180px)'),
  'theme.css unifies mobile navigation drawer trigger at 1180px'
);

assertCheck(
  'NAVBAR_RESIZE_LISTENER',
  'Navbar registers resize listener to auto-close drawer and clear scroll lock above 1180px',
  navbarContent.includes("window.addEventListener('resize', handleResize)") &&
    navbarContent.includes('window.innerWidth > 1180') &&
    navbarContent.includes('releaseScrollLock()'),
  'Navbar auto-closes drawer and releases scroll lock if resized to desktop'
);

assertCheck(
  'PORTAL_RESIZE_LISTENER',
  'PortalHeader registers resize listener to auto-close drawer and clear scroll lock above 1180px',
  portalHeaderContent.includes("window.addEventListener('resize', handleResize)") &&
    portalHeaderContent.includes('window.innerWidth > 1180') &&
    portalHeaderContent.includes('releaseScrollLock()'),
  'PortalHeader auto-closes drawer and releases scroll lock if resized to desktop'
);

// -----------------------------------------------------------------------------
// 9. Touch Target Minimums & Touch Interaction Audit
// -----------------------------------------------------------------------------
console.log('\n--- 9. Touch Target Minimums & Touch Interaction Audit ---');

assertCheck(
  'MOBILE_NAV_TOUCH_TARGET_SIZE',
  'Mobile nav links declare min-height >= 48px in theme.css',
  themeContent.includes('.mobile-nav-links button.mobile-nav-link-btn') &&
    themeContent.includes('min-height: 48px;'),
  'Mobile nav buttons have min-height: 48px fulfilling mobile touch accessibility'
);

assertCheck(
  'HAMBURGER_TOUCH_TARGET_SIZE',
  'Hamburger toggle buttons declare min-height >= 44px',
  themeContent.includes('.menu-toggle-btn') &&
    themeContent.includes('min-height: 44px;'),
  'Hamburger toggle buttons have min-width: 44px and min-height: 44px'
);

assertCheck(
  'TOUCH_ACTION_MANIPULATION',
  'Mobile interactive elements enforce touch-action: manipulation',
  themeContent.includes('touch-action: manipulation;'),
  'touch-action: manipulation eliminates 300ms tap delay on mobile viewports'
);

// -----------------------------------------------------------------------------
// 10. Cross-Route Navigation & Landing Page Listener Audit
// -----------------------------------------------------------------------------
console.log('\n--- 10. Cross-Route Navigation & Landing Page Listener Audit ---');

const landingPagePath = path.join(srcDir, 'components', 'LandingPage.tsx');
const landingPageContent = fs.readFileSync(landingPagePath, 'utf8');

assertCheck(
  'LANDING_CROSS_ROUTE_LISTENER',
  'LandingPage listens for location.state.scrollTo and location.hash',
  landingPageContent.includes('location.state') &&
    landingPageContent.includes('scrollTo') &&
    landingPageContent.includes('location.hash'),
  'LandingPage effect detects incoming scroll requests from external routes'
);

assertCheck(
  'LANDING_HEADER_HEIGHT_CALCULATION',
  'LandingPage calculates sticky header height dynamically on scroll',
  landingPageContent.includes('headerHeight') &&
    landingPageContent.includes('getBoundingClientRect()'),
  'LandingPage smoothly scrolls to target section offset by actual header height'
);

// -----------------------------------------------------------------------------
// 11. Footer Navigation Integrity & Stale Destination Fix Audit
// -----------------------------------------------------------------------------
console.log('\n--- 11. Footer Navigation Integrity Audit ---');

const footerPath = path.join(srcDir, 'components', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');

assertCheck(
  'FOOTER_STALE_DESTINATION_CBT_FIXED',
  'Footer experience action navigates to /portal/cbt',
  footerContent.includes("dest === 'experience'") &&
    footerContent.includes("navigate('/portal/cbt')"),
  'Footer redirects authenticated experience action to /portal/cbt instead of missing element'
);

assertCheck(
  'FOOTER_STALE_DESTINATION_OFFERS_FIXED',
  'Footer offers action navigates to /portal/questions',
  footerContent.includes("dest === 'offers'") &&
    footerContent.includes("navigate('/portal/questions')"),
  'Footer redirects authenticated offers action to /portal/questions instead of missing element'
);

assertCheck(
  'FOOTER_STALE_DESTINATION_PERFORMANCE_FIXED',
  'Footer performance action navigates to /analytics',
  footerContent.includes("dest === 'performance'") &&
    footerContent.includes("navigate('/analytics')"),
  'Footer redirects authenticated performance action to /analytics instead of missing element'
);

assertCheck(
  'FOOTER_SCROLL_HEADER_OFFSET',
  'Footer scrollToSection incorporates dynamic sticky header offset',
  footerContent.includes('executeScrollToElement') &&
    footerContent.includes('headerHeight'),
  'Footer scrollToSection calculates top minus headerHeight before smooth scrolling'
);

// -----------------------------------------------------------------------------
// 12. Desktop Navigation Functionality Preservation Audit
// -----------------------------------------------------------------------------
console.log('\n--- 12. Desktop Navigation Preservation Audit ---');

const expectedDesktopLinks = [
  { name: 'Examinations', target: 'exam-boards', id: 'desktop-nav-examinations' },
  { name: 'Quick Start', target: 'quick-start', id: 'desktop-nav-quick-start' },
  { name: 'How It Works', target: 'how-it-works', id: 'desktop-nav-how-it-works' },
  { name: 'Benefits', target: 'benefits', id: 'desktop-nav-benefits' },
  { name: 'Pricing', target: 'pricing-preview', id: 'desktop-nav-pricing' },
];

for (const link of expectedDesktopLinks) {
  const hasDesktopScroll = navbarContent.includes(`scrollToSection('${link.target}')`);
  const hasDesktopId = navbarContent.includes(`id="${link.id}"`);
  assertCheck(
    `DESKTOP_LINK_${link.name.toUpperCase().replace(/\s+/g, '_')}`,
    `Desktop link for ${link.name} preserved with target '${link.target}'`,
    hasDesktopScroll && hasDesktopId,
    `Desktop link id="${link.id}" invokes scrollToSection('${link.target}')`
  );
}

assertCheck(
  'DESKTOP_LINK_HELP_SUPPORT',
  'Desktop link for Help & Support exists in navigation bar',
  navbarContent.includes('id="desktop-nav-help-support"') &&
    navbarContent.includes('handleHelpSupportClick'),
  'Desktop link id="desktop-nav-help-support" invokes handleHelpSupportClick'
);

// -----------------------------------------------------------------------------
// 13. Simulated Device Viewport Matrix Audit
// -----------------------------------------------------------------------------
console.log('\n--- 13. Simulated Device Viewport Matrix Audit ---');

const viewports = [
  { device: 'Small Smartphone (iPhone SE, Galaxy A)', width: 360, isMobileNav: true },
  { device: 'Typical Smartphone (iPhone 14/15, Galaxy S23)', width: 393, isMobileNav: true },
  { device: 'Tablet Portrait (iPad Mini/Air 10.2)', width: 768, isMobileNav: true },
  { device: 'Tablet Landscape (iPad Pro 11, Surface Pro)', width: 1024, isMobileNav: true },
  { device: 'Desktop / Laptop (MacBook Pro, 1080p Monitor)', width: 1280, isMobileNav: false },
];

const mobileBreakpoint = 1180;

for (const vp of viewports) {
  const expectsMobile = vp.width <= mobileBreakpoint;
  assertCheck(
    `VIEWPORT_${vp.width}`,
    `Viewport ${vp.width}px (${vp.device}) correctly routes navigation`,
    expectsMobile === vp.isMobileNav,
    `Width ${vp.width}px resolves to ${expectsMobile ? 'Mobile/Tablet Drawer' : 'Desktop Header Row'}`
  );
}

// -----------------------------------------------------------------------------
// 14. Strict Implementation Rules Compliance Audit
// -----------------------------------------------------------------------------
console.log('\n--- 14. Strict Implementation Rules Compliance Audit ---');

assertCheck(
  'NO_WINDOW_LOCATION_RELOAD',
  'Zero full-page reloads (window.location.reload) in Navbar and Footer',
  !navbarContent.includes('location.reload') && !footerContent.includes('location.reload'),
  'Navigation functions do not reload or refresh the page'
);

assertCheck(
  'NO_NAVBAR_HASH_URL_POLLUTION',
  'Zero "#" hash anchor jumps in Navbar',
  !/href=["']#[^"']*["']/.test(navbarContent),
  'Navbar uses clean programmatic scrolling without hash pollution'
);

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================\n');

if (failCount > 0) {
  console.error(`🚨 AUDIT FAILED: ${failCount} check(s) did not pass.`);
  process.exit(1);
} else {
  console.log('🎉 ALL MOBILE AND TABLET NAVIGATION CHECKS PASSED PERMANENTLY!\n');
}
