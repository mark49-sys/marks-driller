import React from 'react';
import { Hero } from './Hero.js';
import { StudentSuccessCarousel } from './StudentSuccessCarousel.js';
import { ExamBoards } from './ExamBoards.js';
import { QuickStartActions } from './QuickStartActions.js';
import { HowItWorks } from './HowItWorks.js';
import { WhatWeOffer } from './WhatWeOffer.js';
import { SubscriptionTiersPreview } from './SubscriptionTiersPreview.js';
import { CtaBanner } from './CtaBanner.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-root">
      <main>
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
      </main>
    </div>
  );
};

export default LandingPage;
