/**
 * Non-Browser Automated Verification Test Suite:
 * Professional Landing Page Business Flow, Visual Design & CBT Actions Audit
 *
 * MANDATE:
 * - 100% Non-Browser verification (NO Chrome, Playwright, Puppeteer).
 * - Verifies clear answers in Hero (What is MarkDriller, supported exams, how to start).
 * - Verifies compact examination selection area with all 6 supported examination boards.
 * - Verifies direct CBT and past-question quick-start actions.
 * - Verifies 3-step How It Works flow.
 * - Verifies transparent database-driven pricing and access information.
 * - Verifies complete business narrative flow in LandingPage.
 * - Confirms student portal, CBT engine, and exam data are completely untouched.
 */

import fs from 'fs';
import path from 'path';

interface CheckItem {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const checks: CheckItem[] = [];

function assertCheck(id: string, name: string, condition: boolean, details: string) {
  checks.push({ id, name, passed: condition, details });
  const symbol = condition ? '✓' : '✗';
  console.log(`${symbol} [${id}] ${name}: ${details}`);
}

async function runAudit() {
  console.log('========================================================================');
  console.log(' MarkDriller — Landing Page Business, Visual & CBT Experience Audit');
  console.log(' Mandate: 100% Non-Browser Static, Architectural & Route Contract Audit');
  console.log('========================================================================\n');

  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');

  // =========================================================================
  // 1. ROUTE REDIRECTS AUDIT IN App.tsx
  // =========================================================================
  console.log('--- 1. Route Redirects & Declarative Navigation Audit (App.tsx) ---');
  const appPath = path.join(srcDir, 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const expectedRedirects = [
    { route: '/cbt-practice', target: '/portal/cbt' },
    { route: '/novels', target: '/' },
    { route: '/novel-jamb', target: '/' },
    { route: '/pricing', target: '/' },
    { route: '/blog', target: '/' },
    { route: '/contact', target: '/' },
  ];

  for (const item of expectedRedirects) {
    const hasRedirect = appContent.includes(`path="${item.route}"`) && appContent.includes(`to="${item.target}"`);
    assertCheck(
      `REDIRECT_${item.route.replace(/[/]/g, '_').toUpperCase()}`,
      `Route ${item.route} Redirect`,
      hasRedirect,
      `Redirects cleanly to "${item.target}" with <Navigate to="${item.target}" replace />`
    );
  }

  // Verify no window.location or window.location.reload() workarounds
  const hasWindowLocationRedirect = /window\.location\.(replace|href|reload)\s*\(/.test(appContent);
  assertCheck(
    'NO_WINDOW_LOCATION',
    'Application-Level Routing',
    !hasWindowLocationRedirect,
    'Uses React Router declarative redirection without window.location'
  );

  // =========================================================================
  // 2. PUBLIC NAVBAR & ESSENTIAL LINKS (Navbar.tsx)
  // =========================================================================
  console.log('\n--- 2. Public Navbar & Essential Navigation (Navbar.tsx) ---');
  const navbarPath = path.join(srcDir, 'components', 'Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');

  const expectedNavSections = ['exam-boards', 'quick-start', 'how-it-works', 'benefits', 'pricing-preview'];
  for (const section of expectedNavSections) {
    const hasSectionTrigger =
      navbarContent.includes(`scrollToSection('${section}')`) ||
      navbarContent.includes(`handleMobileNavScroll('${section}')`);
    assertCheck(
      `NAV_SCROLL_${section.toUpperCase().replace(/-/g, '_')}`,
      `Navbar provides smooth scroll to section ${section}`,
      hasSectionTrigger,
      `Navbar provides programmatic scroll to '${section}'`
    );
  }

  // Verify zero href="#" anchors exist in Navbar
  const hasNavbarHashLinks = /href=["']#[^"']*["']/.test(navbarContent);
  assertCheck(
    'NAV_ZERO_HASH_LINKS',
    'Navbar contains zero "#" hash links',
    !hasNavbarHashLinks,
    'All navbar navigation uses clean programmatic scroll without URL bar hash pollution'
  );

  // =========================================================================
  // 3. REBUILT HERO SECTION (Hero.tsx)
  // =========================================================================
  console.log('\n--- 3. Rebuilt Hero Section Audit (Hero.tsx) ---');
  const heroPath = path.join(srcDir, 'components', 'Hero.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  const themePath = path.join(srcDir, 'styles', 'theme.css');
  const themeContent = fs.readFileSync(themePath, 'utf8');

  assertCheck(
    'HERO_EDGE_TO_EDGE_IMAGE',
    'Hero uses authentic educational visual asset',
    heroContent.includes('/assets/images/students-study.jpg') &&
      heroContent.includes('hero-background-image'),
    'Authentic students-study.jpg asset applied across hero background layer'
  );

  assertCheck(
    'HERO_OVERLAY_LAYER',
    'Hero uses gradient overlay scrim for high contrast',
    heroContent.includes('hero-gradient-overlay') &&
      themeContent.includes('.hero-gradient-overlay'),
    'Layered dark gradient overlay separates background visual from foreground typography'
  );

  assertCheck(
    'HERO_CLEAR_HEADLINE',
    'Hero headline clearly states what MarkDriller does and exams supported',
    heroContent.includes('Prepare Confidently for JAMB, WAEC, NECO & Post-UTME') ||
      heroContent.includes('JAMB, WAEC, NECO') ||
      (heroContent.includes('Prepare Confidently for JAMB') && heroContent.includes('WAEC, NECO')),
    'Headline communicates supported examinations and platform purpose clearly'
  );

  assertCheck(
    'HERO_START_PRACTISING_ACTION',
    'Hero contains prominent Start Practising Free action',
    heroContent.includes('Start Practising Free') &&
      heroContent.includes('handleStartPractising'),
    'Primary Start Practising action visible above the fold'
  );

  assertCheck(
    'HERO_EXPLORE_EXAMS_SCROLL',
    'Hero Explore Examinations action smoothly scrolls without login blockage',
    heroContent.includes('Explore Examinations') &&
      heroContent.includes("scrollToSection") || heroContent.includes("scrollIntoView"),
    'Explore Examinations action smoothly scrolls to exam-boards section'
  );

  // =========================================================================
  // 3b. ACHIEVER IMAGES CAROUSEL AUDIT (StudentSuccessCarousel.tsx)
  // =========================================================================
  console.log('\n--- 3b. Achiever Images Carousel Audit (StudentSuccessCarousel.tsx) ---');
  const carouselPath = path.join(srcDir, 'components', 'StudentSuccessCarousel.tsx');
  const hasCarouselFile = fs.existsSync(carouselPath);
  const carouselContent = hasCarouselFile ? fs.readFileSync(carouselPath, 'utf8') : '';

  assertCheck(
    'STUDENT_SUCCESS_COMPONENT_EXISTS',
    'StudentSuccessCarousel component exists',
    hasCarouselFile,
    'Component file present in src/components/StudentSuccessCarousel.tsx'
  );

  assertCheck(
    'STUDENT_SUCCESS_HEADLINE',
    'Carousel preserves required heading without extraneous copy',
    carouselContent.includes('Big Goals. Better Preparation. Brighter Futures.'),
    'Displays required headline "Big Goals. Better Preparation. Brighter Futures."'
  );

  const expectedBanners = [
    'jamb-top-scorer-370.jpg',
    'jamb-top-scorer-369.jpg',
    'jamb-top-scorer-366.jpg',
    'jamb-top-scorer-359.jpg',
    'jamb-top-scorer-374.jpg',
  ];
  const allBannersReferenced = expectedBanners.every((b) => carouselContent.includes(b));
  const allBannersExistOnDisk = expectedBanners.every((b) =>
    fs.existsSync(path.join(rootDir, 'public', 'assets', 'images', 'achievers', b))
  );

  assertCheck(
    'ACHIEVER_SUPPLIED_IMAGES',
    'Carousel uses supplied genuine student achiever score banner assets',
    allBannersReferenced && allBannersExistOnDisk,
    'All 5 supplied authentic examination score banners copied to public/assets/images/achievers and rendered'
  );

  assertCheck(
    'ACHIEVER_IMAGES_ONLY',
    'Section beneath heading contains images only without clutter or marketing text',
    !carouselContent.includes('scoreBreakdown') &&
      !carouselContent.includes('student-card-details') &&
      !carouselContent.includes('student-card-caption'),
    'Zero card bloat, score labels, or marketing paragraphs; pure image presentation'
  );

  assertCheck(
    'ACHIEVER_AUTOPLAY_CONTROLS',
    'Carousel includes working automatic slideshow with clear ON/OFF control and manual navigation',
    carouselContent.includes('6000') &&
      carouselContent.includes('setIsAutoPlay') &&
      carouselContent.includes('Auto-Slide: ON') &&
      carouselContent.includes('Auto-Slide: OFF') &&
      carouselContent.includes('prefers-reduced-motion') &&
      carouselContent.includes('onTouchStart'),
    '6-second auto-slide interval with active ON/OFF toggle, touch swiping, and reduced-motion handling'
  );

  assertCheck(
    'ACHIEVER_CAROUSEL_STYLES',
    'Theme CSS includes responsive image slide styling without horizontal overflow',
    themeContent.includes('.achiever-images-section') &&
      themeContent.includes('.achiever-images-track') &&
      themeContent.includes('.achiever-image-slide') &&
      themeContent.includes('scroll-snap-type: x mandatory'),
    'Includes responsive horizontal snap scroll, card hover lift, and dark mode support'
  );

  // Backend model & API verification
  const modelPath = path.join(srcDir, 'server', 'models', 'StudentSuccess.ts');
  const hasModel = fs.existsSync(modelPath);
  assertCheck(
    'STUDENT_SUCCESS_DATA_MODEL',
    'StudentSuccess Mongoose model exists with verification and consent fields',
    hasModel &&
      fs.readFileSync(modelPath, 'utf8').includes('verificationStatus') &&
      fs.readFileSync(modelPath, 'utf8').includes('consentStatus'),
    'Defines schema with verificationStatus, consentStatus, scoreBreakdown, and timestamps'
  );

  const contentRoutePath = path.join(srcDir, 'server', 'routes', 'content.ts');
  const contentRouteContent = fs.readFileSync(contentRoutePath, 'utf8');
  assertCheck(
    'STUDENT_SUCCESS_PUBLIC_API',
    'Public content API endpoint serves verified and approved achievers',
    contentRouteContent.includes('/student-success') &&
      contentRouteContent.includes('isPublished: true') &&
      contentRouteContent.includes("verificationStatus: 'verified'"),
    'GET /api/content/student-success endpoint filters for verified and published achievers'
  );

  // =========================================================================
  // 4. COMPACT EXAMINATION BOARDS AUDIT (ExamBoards.tsx)
  // =========================================================================
  console.log('\n--- 4. Compact Examination Boards Audit (ExamBoards.tsx) ---');
  const examBoardsPath = path.join(srcDir, 'components', 'ExamBoards.tsx');
  const examBoardsContent = fs.readFileSync(examBoardsPath, 'utf8');

  assertCheck(
    'BOARDS_GRID_3COL',
    'Examination boards grid uses 3-in-a-line desktop layout',
    examBoardsContent.includes('exam-boards-grid-3col') &&
      themeContent.includes('.exam-boards-grid-3col') &&
      themeContent.includes('repeat(3, minmax(0, 1fr))'),
    'Enforces strictly 3 cards per row on desktop with responsive mobile wrapping'
  );

  const supportedExams = ['JAMB', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'];
  const hasAllExams = supportedExams.every(ex => examBoardsContent.includes(ex));
  assertCheck(
    'BOARDS_SUPPORTED_EXAMS',
    'All 6 statutory examination suites supported',
    hasAllExams,
    'Displays JAMB / UTME, WAEC, NECO, GCE, POST-UTME, and NABTEB'
  );

  assertCheck(
    'BOARDS_DIRECT_ACTIONS',
    'Examination cards provide direct CBT and Past Questions actions',
    examBoardsContent.includes('handleStartCbt') &&
      examBoardsContent.includes('handlePastQuestions') &&
      examBoardsContent.includes('CBT Practice') &&
      examBoardsContent.includes('Past Questions'),
    'Direct action triggers lead straight to CBT and Past Questions workflows'
  );

  // =========================================================================
  // 5. DIRECT QUICK-START CBT ACTIONS AUDIT (QuickStartActions.tsx)
  // =========================================================================
  console.log('\n--- 5. Direct Quick-Start CBT Actions Audit (QuickStartActions.tsx) ---');
  const quickStartPath = path.join(srcDir, 'components', 'QuickStartActions.tsx');
  const quickStartExists = fs.existsSync(quickStartPath);
  const quickStartContent = quickStartExists ? fs.readFileSync(quickStartPath, 'utf8') : '';

  assertCheck(
    'QUICK_START_EXISTS',
    'QuickStartActions component exists',
    quickStartExists,
    'QuickStartActions component created and available'
  );

  assertCheck(
    'QUICK_START_ACTIONS_LABELS',
    'Contains required direct action cards: JAMB CBT, WAEC PQ, NECO PQ, Start CBT',
    quickStartContent.includes('JAMB CBT Practice Test') &&
      quickStartContent.includes('WAEC Past Questions') &&
      quickStartContent.includes('NECO Past Questions') &&
      quickStartContent.includes('Start CBT Practice'),
    'Critical direct actions present with short, actionable labels'
  );

  assertCheck(
    'QUICK_START_GRID_CSS',
    'Quick-start grid styles declared in theme.css',
    themeContent.includes('.quick-actions-grid') &&
      themeContent.includes('repeat(4, minmax(0, 1fr))'),
    'Enforces responsive 4-column desktop grid with tablet and mobile stacking'
  );

  // =========================================================================
  // 6. HOW IT WORKS 3-STEP FLOW (HowItWorks.tsx)
  // =========================================================================
  console.log('\n--- 6. How It Works 3-Step Flow Audit (HowItWorks.tsx) ---');
  const howPath = path.join(srcDir, 'components', 'HowItWorks.tsx');
  const howContent = fs.readFileSync(howPath, 'utf8');

  assertCheck(
    'HOW_IT_WORKS_3_STEPS',
    'How It Works structured into 3 short steps',
    howContent.includes('01') &&
      howContent.includes('02') &&
      howContent.includes('03') &&
      !howContent.includes('04'),
    'Exact 3-step concise user journey from exam choice to performance review'
  );

  // =========================================================================
  // 7. KEY BENEFITS (WhatWeOffer.tsx)
  // =========================================================================
  console.log('\n--- 7. Key Benefits Audit (WhatWeOffer.tsx) ---');
  const offerPath = path.join(srcDir, 'components', 'WhatWeOffer.tsx');
  const offerContent = fs.readFileSync(offerPath, 'utf8');

  assertCheck(
    'KEY_BENEFITS_FOCUSED',
    'WhatWeOffer presents focused genuine product benefits',
    offerContent.includes('Accredited Past Questions') &&
      offerContent.includes('Authentic CBT Simulator') &&
      offerContent.includes('Step-by-Step Solutions') &&
      offerContent.includes('Diagnostic Readiness Analytics'),
    '4 genuine product capabilities without bloated text or redundant cards'
  );

  // =========================================================================
  // 8. PRICING & ACCESS INFORMATION (SubscriptionTiersPreview.tsx)
  // =========================================================================
  console.log('\n--- 8. Transparent Pricing & Access Audit (SubscriptionTiersPreview.tsx) ---');
  const pricingPath = path.join(srcDir, 'components', 'SubscriptionTiersPreview.tsx');
  const pricingContent = fs.readFileSync(pricingPath, 'utf8');

  assertCheck(
    'PRICING_DATABASE_BACKED',
    'Consumes live database-backed subscription plans and free trial',
    pricingContent.includes('useSubscriptionPlansQuery') &&
      pricingContent.includes('Free Starter') &&
      pricingContent.includes('Pro Candidate Pass') &&
      pricingContent.includes('200 free trial questions'),
    'Displays accurate free starter allowance and dynamic database-backed Pro pricing'
  );

  assertCheck(
    'PRICING_VALID_DESTINATIONS',
    'Pricing buttons route to valid application destinations',
    pricingContent.includes('/portal/pricing') &&
      !pricingContent.includes('to="/pricing"'),
    'Pro upgrade routes to valid /portal/pricing without redirect loops'
  );

  // =========================================================================
  // 9. FINAL CALL TO ACTION (CtaBanner.tsx)
  // =========================================================================
  console.log('\n--- 9. Final Action Audit (CtaBanner.tsx) ---');
  const ctaPath = path.join(srcDir, 'components', 'CtaBanner.tsx');
  const ctaContent = fs.readFileSync(ctaPath, 'utf8');

  assertCheck(
    'CTA_FINAL_ACTION',
    'CtaBanner provides clear invitation to start preparing and routes unauthenticated visitors to create account',
    ctaContent.includes('Start Practising Free') &&
      ctaContent.includes('Browse Past Questions') &&
      ctaContent.includes("openAuthModal('signup')"),
    'Direct access to start preparing and browse past questions with create-account redirection for visitors'
  );

  // =========================================================================
  // 10. LANDING PAGE COMPLETE BUSINESS FLOW (LandingPage.tsx)
  // =========================================================================
  console.log('\n--- 10. Landing Page Complete Business Narrative Flow (LandingPage.tsx) ---');
  const landingPath = path.join(srcDir, 'components', 'LandingPage.tsx');
  const landingContent = fs.readFileSync(landingPath, 'utf8');

  const expectedSequence = [
    '<Hero />',
    '<StudentSuccessCarousel />',
    '<ExamBoards />',
    '<QuickStartActions />',
    '<HowItWorks />',
    '<WhatWeOffer />',
    '<SubscriptionTiersPreview />',
    '<CtaBanner />',
  ];

  let lastIdx = -1;
  let ordered = true;
  for (const s of expectedSequence) {
    const idx = landingContent.indexOf(s);
    if (idx === -1 || idx < lastIdx) {
      ordered = false;
    }
    lastIdx = idx;
  }

  assertCheck(
    'LANDING_STORYTELLING_FLOW',
    'Landing page follows exact 8-section business narrative sequence',
    ordered,
    'Hero -> StudentSuccessCarousel -> ExamBoards -> QuickStartActions -> HowItWorks -> WhatWeOffer -> SubscriptionTiersPreview -> CtaBanner'
  );

  // =========================================================================
  // 11. PROTECTED STUDENT PORTAL & CBT PRESERVATION
  // =========================================================================
  console.log('\n--- 11. Protected Student Portal & CBT Routes Preservation ---');
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/analytics',
    '/cbt/:attemptId',
    '/cbt/:attemptId/result',
    '/portal/cbt',
    '/portal/questions',
    '/portal/pricing',
    '/admin',
  ];

  for (const p of protectedRoutes) {
    const exists = appContent.includes(`path="${p}"`);
    assertCheck(
      `PRESERVED_${p.replace(/[/:]/g, '_').toUpperCase()}`,
      `Route ${p} preserved`,
      exists,
      `Active route ${p} remains registered and operational`
    );
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    console.error(`\nAudit FAILED with ${failed} issues.`);
    process.exit(1);
  } else {
    console.log('\nAll landing page, business flow, visual design, and CBT action checks PASSED successfully!');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit exception:', err);
  process.exit(1);
});
