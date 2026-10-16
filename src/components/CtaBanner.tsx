import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { SafeImage } from './SafeImage.js';

export const CtaBanner: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleStartPractising = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  const handleBrowseQuestions = () => {
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate('/questions');
    }
  };

  return (
    <section className="cta-banner" id="cta" aria-label="Final call to action">
      <div className="wrap">
        <div className="cta-banner-wrapper">
          <div className="cta-banner-content">
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--amber, #fbbf24)',
                display: 'inline-block',
                marginBottom: '10px',
              }}
            >
              Academic Ambition &amp; Convocation Success
            </span>
            <h2>Your Next High Examination Score Starts with Today's Practice Set</h2>
            <p>
              Join thousands of Nigerian secondary and tertiary candidates preparing with verified past questions and real CBT simulation. Free to begin.
            </p>
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
                onClick={handleBrowseQuestions}
                aria-label="Browse past questions catalog"
              >
                Browse Past Questions
              </button>
            </div>
          </div>

          <div className="cta-banner-visual" aria-label="Graduate celebration milestone">
            <SafeImage
              src="/assets/images/graduation-achievement.jpg"
              alt="Proud Nigerian university graduate celebrating convocation and academic achievement"
              loading="lazy"
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px 14px',
                background: 'rgba(8, 13, 27, 0.88)',
                backdropFilter: 'blur(6px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11.5px',
                fontFamily: "var(--font-sans)",
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
              }}
            >
              🎓 Future Milestone · Prepare with Confidence Today
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
