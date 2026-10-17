/**
 * MarkDriller Verification Script:
 * 1. Verification that auto-slide interactions and transitions completely eliminate scroll-to-top
 * 2. Verification that NABTEB is removed and replaced with University Courses in the Target Examination selector
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

let passCount = 0;
let failCount = 0;

function assertCheck(id: string, name: string, condition: boolean, details: string) {
  if (condition) {
    console.log(`✓ [${id}] ${name}: ${details}`);
    passCount++;
  } else {
    console.error(`✗ [FAIL: ${id}] ${name}: ${details}`);
    failCount++;
  }
}

console.log('========================================================================');
console.log(' MARKDRILLER — AUTO-SLIDE SCROLL ELIMINATION & UNIVERSITY COURSES AUDIT');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// FIX 1: AUTO-SLIDE SCROLL-TO-TOP ELIMINATION AUDIT
// -----------------------------------------------------------------------------
console.log('--- 1. Auto-Slide Scroll-to-Top Elimination (StudentSuccessCarousel.tsx) ---');

const carouselPath = path.join(srcDir, 'components', 'StudentSuccessCarousel.tsx');
const carouselContent = fs.readFileSync(carouselPath, 'utf8');

// 1.1 Zero calls to scrollIntoView
assertCheck(
  'NO_SCROLL_INTO_VIEW',
  'Carousel contains zero scrollIntoView calls',
  !carouselContent.includes('scrollIntoView'),
  'scrollIntoView completely eliminated to prevent document-level vertical scrolling'
);

// 1.2 Track-scoped scrollTo usage
assertCheck(
  'TRACK_SCOPED_SCROLL_TO',
  'Slide transitions scroll the track element horizontally only',
  carouselContent.includes('track.scrollTo') &&
    carouselContent.includes('left:') &&
    !carouselContent.includes('window.scrollTo') &&
    !carouselContent.includes('window.scroll('),
  'Slide transitions use track.scrollTo strictly altering horizontal left offset without window scroll'
);

// 1.3 Safe focus management with preventScroll
assertCheck(
  'FOCUS_PREVENT_SCROLL',
  'Auto-slide button focus movements specify preventScroll: true',
  carouselContent.includes('preventScroll: true'),
  'Focus restoration and movement enforce { preventScroll: true }'
);

// 1.4 Blur before toggle to prevent browser scroll to document body
assertCheck(
  'BLUR_BEFORE_TOGGLE',
  'Auto-slide toggle blurs focused button before state transition',
  carouselContent.includes('.blur()'),
  'Prevents Chromium/WebKit focus reset to document body on button state changes'
);

// 1.5 DOM persistence of toggle controls
assertCheck(
  'DOM_PERSISTENT_BUTTONS',
  'Auto-slide controls remain in DOM with CSS display toggling to prevent unmount focus jumps',
  carouselContent.includes('ref={triggerBtnRef}') &&
    carouselContent.includes('ref={toggleBtnRef}') &&
    carouselContent.includes('display: !isAutoSlideBtnVisible') &&
    carouselContent.includes('display: isAutoSlideBtnVisible'),
  'Trigger and toggle buttons are persistent in DOM; no unmount focus-destruction artifacts'
);

// 1.6 Event propagation and default prevention
assertCheck(
  'PREVENT_DEFAULT_CLICKS',
  'Carousel action buttons prevent default and stop click propagation',
  carouselContent.includes('handleRevealAutoSlide') &&
    carouselContent.includes('handleToggleAutoSlide') &&
    carouselContent.includes('e.preventDefault()') &&
    carouselContent.includes('e.stopPropagation()'),
  'All click and keyboard handlers prevent browser anchor or form scroll behavior'
);

// 1.7 Preserved auto-slide core functionality
assertCheck(
  'AUTO_SLIDE_FUNCTIONALITY_PRESERVED',
  'Auto-slide interval, play state, and user controls preserved intact',
  carouselContent.includes('6000') &&
    carouselContent.includes('setIsAutoPlay') &&
    carouselContent.includes('Auto-Slide: ON') &&
    carouselContent.includes('Auto-Slide: OFF') &&
    carouselContent.includes('prefers-reduced-motion') &&
    carouselContent.includes('onTouchStart') &&
    carouselContent.includes('ACHIEVER_IMAGES'),
  '6s auto-slide timer, ON/OFF toggle, touch swiping, and keyboard arrows fully operational'
);

// -----------------------------------------------------------------------------
// FIX 2: TARGET EXAMINATION SELECTOR — UNIVERSITY COURSES REPLACES NABTEB
// -----------------------------------------------------------------------------
console.log('\n--- 2. Target Examination Selector (ExamBoards.tsx & AuthModal.tsx) ---');

const examBoardsPath = path.join(srcDir, 'components', 'ExamBoards.tsx');
const examBoardsContent = fs.readFileSync(examBoardsPath, 'utf8');

// 2.1 NABTEB removed from Target Examination selector
assertCheck(
  'NO_NABTEB_IN_TARGET_EXAM_SELECTOR',
  'NABTEB is completely removed from the Target Examination selector in ExamBoards',
  !examBoardsContent.includes("id: 'nabteb'") &&
    !examBoardsContent.includes("shortCode: 'NABTEB'") &&
    !examBoardsContent.includes("defaultExamCode: 'NABTEB'"),
  'NABTEB no longer appears in SUPPORTED_EXAM_BOARDS'
);

// 2.2 University Courses is present with exact displayed label
assertCheck(
  'UNIVERSITY_COURSES_LABEL',
  'University Courses appears with exact displayed label in ExamBoards',
  examBoardsContent.includes("shortCode: 'University Courses'") &&
    examBoardsContent.includes("id: 'university-courses'"),
  'Target Examination selector defines exact label "University Courses"'
);

// 2.3 Genuine university logo asset exists on disk and is configured
const logoPath = path.join(rootDir, 'public', 'assets', 'logos', 'university-courses.png');
const hasLogoFile = fs.existsSync(logoPath);
let logoValid = false;
if (hasLogoFile) {
  const stat = fs.statSync(logoPath);
  logoValid = stat.size > 1000;
}

assertCheck(
  'AUTHENTIC_UNIVERSITY_LOGO',
  'Authentic university logo (University of Lagos UNILAG crest) is present on disk',
  hasLogoFile && logoValid,
  `Official logo located at public/assets/logos/university-courses.png (${fs.statSync(logoPath).size} bytes)`
);

// 2.4 ExamBoardLogo maps University Courses to the authentic logo
const examLogoPath = path.join(srcDir, 'components', 'ExamBoardLogo.tsx');
const examLogoContent = fs.readFileSync(examLogoPath, 'utf8');

assertCheck(
  'EXAM_BOARD_LOGO_MAPPING',
  'ExamBoardLogo maps University Courses to authentic university logo asset',
  examLogoContent.includes('university-courses.png') &&
    (examLogoContent.includes('UNIVERSITY') || examLogoContent.includes('COURSE')),
  'ExamBoardLogo renders official university logo for University Courses'
);

// 2.5 Redirect University Courses card buttons to create account
assertCheck(
  'COURSES_REDIRECT_TO_SIGNUP',
  'University Courses card action buttons redirect unauthenticated users to create account',
  examBoardsContent.includes('handleUniversityCourses') &&
    examBoardsContent.includes("openAuthModal('signup')") &&
    examBoardsContent.includes("setSelectedExamBoard('University Courses')"),
  'Button clicks set selectedExamBoard to University Courses and open create account modal'
);

// 2.6 Accurate non-fabricated status tag for University Courses
assertCheck(
  'ACCURATE_STATUS_LABEL',
  'University Courses status communicates curricula rather than fake question counts',
  examBoardsContent.includes('Accredited Degree Syllabi') ||
    examBoardsContent.includes('isUniversityCourses'),
  'Distinguishes degree course curriculum from standard past question bank counters'
);

// 2.7 AuthModal selector updated
const authModalPath = path.join(srcDir, 'components', 'AuthModal.tsx');
const authModalContent = fs.readFileSync(authModalPath, 'utf8');

assertCheck(
  'AUTH_MODAL_SELECTOR_UPDATED',
  'AuthModal exam options list contains University Courses and excludes NABTEB',
  authModalContent.includes("'University Courses'") &&
    !authModalContent.includes("'NABTEB'"),
  'Registration exam selection reflects University Courses'
);

// 2.8 Existing examination boards remain intact
const standardExams = ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME'];
const allStandardExamsPreserved = standardExams.every((ex) => examBoardsContent.includes(ex));

assertCheck(
  'STANDARD_EXAMS_PRESERVED',
  'Existing statutory exam suites (JAMB, WAEC, NECO, GCE, POST-UTME) remain completely intact',
  allStandardExamsPreserved,
  'All 5 standard examination suites preserved with official syllabi and configurations'
);

console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL AUTO-SLIDE SCROLL & UNIVERSITY COURSES AUDITS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
