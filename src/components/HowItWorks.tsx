import React from 'react';
import { SafeImage } from './SafeImage.js';

interface StepItem {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  badge: string;
}

const THREE_STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Choose Your Examination',
    description: 'Select your target examination board — JAMB/UTME, WAEC, NECO, GCE, or university Post-UTME screening.',
    image: '/assets/images/collaborative-learning.jpg',
    imageAlt: 'Nigerian students discussing past question papers and studying syllabus topics together',
    badge: 'Peer Collaboration',
  },
  {
    number: '02',
    title: 'Practice Questions & CBT Mocks',
    description: 'Solve curriculum past questions topic-by-topic or sit full-length timed CBT simulations with authentic 8-key controls.',
    image: '/assets/images/cbt-student-lab.jpg',
    imageAlt: 'Focused Nigerian student taking an official computer-based testing CBT simulation in a computer lab',
    badge: 'Real CBT Simulation',
  },
  {
    number: '03',
    title: 'Review Performance & Improve',
    description: 'Inspect step-by-step solutions, identify weak subject areas with diagnostic analytics, and boost your score readiness.',
    image: '/assets/images/student-grade-review.jpg',
    imageAlt: 'Pleased Nigerian student reviewing high test examination scores and diagnostic progress on a study laptop',
    badge: 'Diagnostic Results',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="section" id="how-it-works" aria-label="How MarkDriller Works">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <span className="eyebrow">Clear 3-Step Process</span>
          <h2>How MarkDriller Works</h2>
          <p style={{ maxWidth: '620px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            A structured, proven preparation workflow designed to build exam mastery and speed.
          </p>
        </div>
        <div className="steps" style={{ marginTop: '32px' }}>
          {THREE_STEPS.map((step) => (
            <div className="step" key={step.number}>
              <div className="step-image-box">
                <SafeImage
                  src={step.image}
                  alt={step.imageAlt}
                  loading="lazy"
                />
                <span className="step-badge">{step.badge}</span>
              </div>
              <span className="step-num mono">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
