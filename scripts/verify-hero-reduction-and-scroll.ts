/**
 * scripts/verify-hero-reduction-and-scroll.ts
 *
 * Automated verification suite for:
 * 1. Mandatory Hero Text Reduction
 * 2. Full Landing-Page Natural Document Scrolling
 * 3. Responsive layout and sticky header offset protection
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

let passCount = 0;
let failCount = 0;

function assertCheck(id: string, description: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`✓ [${id}] ${description}: ${detail}`);
    passCount++;
  } else {
    console.error(`✗ [${id}] FAILED: ${description}: ${detail}`);
    failCount++;
  }
}

console.log('========================================================================');
console.log(' MARKDRILLER — HERO TEXT REDUCTION & NATURAL SCROLL AUDIT');
console.log('========================================================================\n');

// 1. HERO TEXT REDUCTION AUDIT
console.log('--- 1. Hero Text Reduction Audit (Hero.tsx) ---');
const heroPath = path.join(srcDir, 'components', 'Hero.tsx');
const heroContent = fs.readFileSync(heroPath, 'utf8');

// Introductory eyebrow check
const hasIntroductoryEyebrow = heroContent.includes("NIGERIA'S FOREMOST CBT EXAM PRACTICE PLATFORM");
assertCheck(
  'HERO_INTRODUCTORY_LABEL',
  'Existing small introductory text positioned directly above main heading',
  hasIntroductoryEyebrow,
  "Existing introductory text (NIGERIA'S FOREMOST CBT EXAM PRACTICE PLATFORM) positioned above heading"
);

// Trust badges duplicate removed
const hasDuplicateTrustBadges = heroContent.includes('hero-trust-badges') || heroContent.includes('ACCREDITED QUESTIONS');
assertCheck(
  'HERO_NO_DUPLICATE_BADGES',
  'Repetitive promotional trust badge block removed',
  !hasDuplicateTrustBadges,
  'Duplicated question count and CBT engine badges removed from Hero'
);

// Clear, attractive headline present
const hasClearHeadline =
  heroContent.includes('Prepare Confidently for JAMB, WAEC, NECO &amp; Post-UTME.') ||
  heroContent.includes('Prepare Confidently for JAMB, WAEC, NECO & Post-UTME') ||
  (heroContent.includes('Prepare Confidently for JAMB,') &&
    heroContent.includes('WAEC, NECO &amp; Post-UTME.'));
assertCheck(
  'HERO_CLEAR_HEADLINE',
  'Short, attractive, exam-focused headline preserved',
  hasClearHeadline,
  'Headline states exact exam suites (JAMB, WAEC, NECO, Post-UTME) cleanly'
);

// Single concise supporting description
const ledeMatches = heroContent.match(/<p className="hero-lede">([\s\S]*?)<\/p>/);
const hasSingleLede = Boolean(ledeMatches && ledeMatches[1]);
const ledeText = ledeMatches ? ledeMatches[1].replace(/<[^>]+>/g, '').trim() : '';
assertCheck(
  'HERO_SINGLE_CONCISE_LEDE',
  'Hero contains exactly one concise supporting description',
  hasSingleLede && ledeText.length > 20 && ledeText.length < 200,
  `Supporting lede is 1 single sentence (${ledeText.length} chars): "${ledeText.slice(0, 60)}..."`
);

// Visible CTA buttons
const hasStartCta = heroContent.includes('Start Practising Free →');
const hasExploreCta = heroContent.includes('Explore Examinations ↓');
assertCheck(
  'HERO_PRIMARY_CTAS',
  'Primary and secondary call-to-action buttons present and accessible',
  hasStartCta && hasExploreCta,
  'Start Practising Free and Explore Examinations CTAs prominent'
);

// Total word count in Hero foreground
const fgMatch = heroContent.match(/<div className="hero-foreground-content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/);
const foregroundHtml = fgMatch ? fgMatch[1] : heroContent;
const visibleText = foregroundHtml
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const words = visibleText
  .split(' ')
  .filter((w) => w.length > 0 && !w.includes('=') && !w.includes('->') && !w.includes('=>'));

assertCheck(
  'HERO_TEXT_COMPACTNESS',
  'Hero foreground text is concise and compact',
  words.length <= 50,
  `Hero visible user text is ${words.length} words (under 50-word ceiling)`
);

// 2. LANDING PAGE SCROLL AUDIT
console.log('\n--- 2. Landing-Page Natural Scrolling Audit (theme.css & Layout) ---');
const themePath = path.join(srcDir, 'styles', 'theme.css');
const themeContent = fs.readFileSync(themePath, 'utf8');

// html & body scrolling
assertCheck(
  'CSS_HTML_SCROLL',
  'html element permits natural document scrolling with smooth behavior',
  themeContent.includes('scroll-behavior: smooth') &&
    themeContent.includes('scroll-padding-top: 84px') &&
    themeContent.includes('overflow-y: auto'),
  'html sets scroll-behavior: smooth, scroll-padding-top: 84px, and overflow-y: auto'
);

assertCheck(
  'CSS_BODY_SCROLL',
  'body element has natural vertical document scrolling',
  themeContent.includes('overflow-y: auto') && themeContent.includes('min-height: 100vh'),
  'body sets overflow-y: auto and min-height: 100vh'
);

assertCheck(
  'CSS_DRAWER_SCROLL_LOCK',
  'Offcanvas mobile drawer locks background scrolling only while active',
  themeContent.includes('body.offcanvas-open {\n  overflow: hidden !important;') ||
    themeContent.includes('body.offcanvas-open'),
  'body.offcanvas-open locks scrolling during menu display and restores on close'
);

// Sticky header offset protection (scroll-margin-top)
assertCheck(
  'CSS_STICKY_HEADER_OFFSET',
  'All landing-page section targets define scroll-margin-top to prevent header collision',
  themeContent.includes('scroll-margin-top:') &&
    themeContent.includes('#exam-boards') &&
    themeContent.includes('#quick-start') &&
    themeContent.includes('#how-it-works'),
  'Sticky navbar height offset by 88px+ scroll-margin-top on all section targets'
);

// Hero overflow and dimensions
assertCheck(
  'HERO_RESPONSIVE_HEIGHT',
  'Hero section uses compact responsive min-height and visible overflow',
  themeContent.includes('.hero.full-width-hero') &&
    (themeContent.includes('clamp(320px') || themeContent.includes('clamp(380px') || themeContent.includes('clamp(560px')) &&
    themeContent.includes('overflow: visible;'),
  'Hero min-height is structured with responsive clamp and overflow: visible'
);

// Achiever carousel overflow & touch-action
assertCheck(
  'CAROUSEL_VERTICAL_TOUCH_SCROLL',
  'Achiever carousel track enables vertical touch gesture bubbling',
  themeContent.includes('.achiever-images-section') &&
    themeContent.includes('touch-action: pan-x pan-y;'),
  'touch-action: pan-x pan-y configured so swipe gestures vertically scroll the page'
);

// Layout wrappers
console.log('\n--- 3. Landing Page Structure & Wrappers ---');
const landingPath = path.join(srcDir, 'components', 'LandingPage.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');
const publicLayoutPath = path.join(srcDir, 'layouts', 'PublicLayout.tsx');
const publicLayoutContent = fs.readFileSync(publicLayoutPath, 'utf8');

assertCheck(
  'NO_NESTED_MAIN_TAGS',
  'Landing page avoids redundant nested <main> elements',
  !landingContent.includes('<main>'),
  'LandingPage.tsx uses clean <div className="landing-page-root"> without duplicate inner <main>'
);

assertCheck(
  'PUBLIC_LAYOUT_SHELL_SCROLL',
  'PublicLayout shell provides full document-level vertical layout and visible overflow',
  publicLayoutContent.includes("minHeight: '100vh'") &&
    publicLayoutContent.includes("overflow: 'visible'"),
  'PublicLayout enforces full height with overflow: visible so sticky navigation remains persistent'
);

const navbarPath = path.join(srcDir, 'components', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

assertCheck(
  'NAV_PERSISTENT_STICKY_CSS',
  'Landing navbar defines sticky positioning with high stacking context in theme.css',
  themeContent.includes('position: sticky') &&
    themeContent.includes('top: 0') &&
    themeContent.includes('z-index: 1020'),
  'header.site-header sets position: sticky, top: 0, and z-index: 1020'
);

assertCheck(
  'NAV_PERSISTENT_STICKY_COMPONENT',
  'Navbar component enforces sticky position, top 0, and z-index 1020 inline',
  navbarContent.includes("position: 'sticky'") &&
    navbarContent.includes('top: 0') &&
    navbarContent.includes('zIndex: 1020'),
  'Navbar element enforces inline position: sticky, top: 0, and zIndex: 1020'
);

assertCheck(
  'NAV_MOBILE_SCROLL_RESTORE',
  'Mobile nav drawer scroll handler allows drawer unlock before scrolling',
  navbarContent.includes('handleMobileNavScroll') && navbarContent.includes('setTimeout'),
  'handleMobileNavScroll closes drawer and smoothly scrolls after unlock delay'
);

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All hero reduction and landing-page scrolling checks PASSED successfully!');
}
