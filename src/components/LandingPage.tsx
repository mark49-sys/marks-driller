import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from './Hero.js';
import { StudentSuccessCarousel } from './StudentSuccessCarousel.js';
import { ExamBoards } from './ExamBoards.js';
import { QuickStartActions } from './QuickStartActions.js';
import { HowItWorks } from './HowItWorks.js';
import { WhatWeOffer } from './WhatWeOffer.js';
import { SubscriptionTiersPreview } from './SubscriptionTiersPreview.js';
import { CtaBanner } from './CtaBanner.js';

export const LandingPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const stateTarget = (location.state as { scrollTo?: string } | null)?.scrollTo;
    const hashTarget = location.hash ? location.hash.replace('#', '') : null;
    const targetId = stateTarget || hashTarget;

    if (targetId) {
      const scrollTimer = setTimeout(() => {
        let el = document.getElementById(targetId);
        if (!el) {
          if (targetId === 'examinations' || targetId === 'exam-boards') {
            el = document.getElementById('exam-boards') || document.getElementById('examinations');
          } else if (targetId === 'pricing' || targetId === 'pricing-preview') {
            el = document.getElementById('pricing-preview') || document.getElementById('pricing');
          }
        }
        if (el) {
          const navHeader = document.querySelector('header.site-header') as HTMLElement | null;
          const headerHeight = navHeader ? navHeader.getBoundingClientRect().height : 80;
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = Math.max(0, rect.top + scrollTop - headerHeight - 16);
          try {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          } catch {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          try {
            if (!el.hasAttribute('tabindex')) {
              el.setAttribute('tabindex', '-1');
            }
            el.focus({ preventScroll: true });
          } catch {
            // Ignore focus errors
          }
        }
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [location.state, location.hash]);

  return (
    <div className="landing-page-root" style={{ width: '100%', overflow: 'visible' }}>
      {/* 1. Hero: What MarkDriller does, who it serves, concise benefit statement, authentic visual */}
      <Hero />

      {/* 2. Student Success & Scores Carousel: Verified Nigerian candidate achievements with consent */}
      <StudentSuccessCarousel />

      {/* 3. Examination Boards: Recognisable, properly sourced logos and supported examination names */}
      <ExamBoards />

      {/* 3. Quick-Start Actions: Direct access to relevant CBT practice and past-question workflows */}
      <QuickStartActions />

      {/* 4. How It Works: Three short, structured steps from target selection to score improvement */}
      <HowItWorks />

      {/* 5. Key Benefits: Focused, genuine product capabilities without redundant walls of text */}
      <WhatWeOffer />

      {/* 6. Pricing & Access: Clear, accurate free trial details and live database-backed subscription plans */}
      <SubscriptionTiersPreview />

      {/* 7. Final Action: High-impact conversion invitation to start preparing today */}
      <CtaBanner />
    </div>
  );
};

export default LandingPage;
