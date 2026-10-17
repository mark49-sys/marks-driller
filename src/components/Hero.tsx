import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTelemetryQuery } from '../api/exams.js';
import { SafeImage } from './SafeImage.js';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: telemetry } = useTelemetryQuery();

  const handleStartPractising = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  const handleExploreBoardsClick = () => {
    const el = document.getElementById('exam-boards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalQuestions = telemetry?.totalQuestions
    ? `${telemetry.totalQuestions.toLocaleString()}+`
    : '4,200+';

  return (
    <section className="hero full-width-hero" id="hero" aria-label="Hero section">
      {/* Layer 1: Edge-to-edge background visual */}
      <div className="hero-background-layer" aria-hidden="true">
        <SafeImage
          src="/assets/images/students-study.jpg"
          alt="Nigerian secondary and university students actively preparing for examination success"
          className="hero-background-image"
          loading="eager"
        />
        {/* Layer 2: Scrim overlay for high-contrast legibility */}
        <div className="hero-gradient-overlay" />
      </div>

      {/* Layer 3: High-impact foreground content visible above the fold */}
      <div className="wrap hero-wrap hero__inner">
        <div className="hero-foreground-content">
          <div className="hero-eyebrow-container">
            <span className="hero-eyebrow-text">
              NIGERIA'S FOREMOST CBT EXAM PRACTICE PLATFORM
            </span>
          </div>

          <h1 className="hero-headline" style={{ color: '#ffffff' }}>
            <span className="hero-headline-line" style={{ color: '#ffffff' }}>Prepare Confidently for JAMB,</span>
            <br className="hero-headline-desktop-break" />
            <span className="hero-headline-line" style={{ color: '#ffffff' }}>WAEC, NECO &amp; Post-UTME.</span>
          </h1>

          <p className="hero-lede">
            Practice <strong>{totalQuestions} verified past questions</strong>, master authentic 8-key CBT simulations, and boost your examination scores with step-by-step solutions.
          </p>

          {/* Primary and Secondary Action CTAs */}
          <div className="hero-actions">
            <button
              type="button"
              className="btn-custom btn-custom-accent btn-custom-lg"
              onClick={handleStartPractising}
            >
              Start Practising Free →
            </button>
            <button
              type="button"
              className="btn-custom btn-custom-ghost-light btn-custom-lg"
              onClick={handleExploreBoardsClick}
              aria-label="Scroll down to explore supported examination boards"
            >
              Explore Examinations ↓
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
