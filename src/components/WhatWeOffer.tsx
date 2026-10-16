import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { useTelemetryQuery } from '../api/exams.js';
import { SafeImage } from './SafeImage.js';

interface BenefitItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  image: string;
  imageAlt: string;
}

export const WhatWeOffer: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const { data: telemetry } = useTelemetryQuery();

  const totalQuestions = telemetry?.totalQuestions
    ? `${telemetry.totalQuestions.toLocaleString()}+`
    : '4,200+';

  const handleBenefitClick = (item: BenefitItem) => {
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate(item.actionTo);
    }
  };

  const benefits: BenefitItem[] = [
    {
      id: 'past-questions',
      icon: '📖',
      title: 'Accredited Past Questions',
      description: `Access ${totalQuestions} curriculum-verified questions covering JAMB, WAEC, NECO, and Post-UTME with accurate answers.`,
      actionLabel: 'Browse Past Questions →',
      actionTo: '/questions',
      image: '/assets/images/library-revision.jpg',
      imageAlt: 'Library past questions revision catalog and study guides',
    },
    {
      id: 'cbt-engine',
      icon: '💻',
      title: 'Authentic CBT Simulator',
      description: 'Practice with official 8-key keyboard shortcuts (A, B, C, D, P, N, S, R), on-screen calculator, and official exam clocks.',
      actionLabel: 'Explore CBT Simulator →',
      actionTo: '/portal/cbt',
      image: '/assets/images/cbt-practice.jpg',
      imageAlt: 'Computer-based testing simulator interface and exam timing station',
    },
    {
      id: 'worked-solutions',
      icon: '💡',
      title: 'Step-by-Step Solutions',
      description: 'Understand every answer with complete mathematical workings, formula breakdowns, and Chief Examiner remarks.',
      actionLabel: 'See Solved Answers →',
      actionTo: '/questions',
      image: '/assets/images/books-study.jpg',
      imageAlt: 'Detailed step-by-step mathematical workings and open solution notebooks',
    },
    {
      id: 'analytics',
      icon: '📊',
      title: 'Diagnostic Readiness Analytics',
      description: 'Track subject accuracy, average time spent per question, and pinpoint exact topics needing revision before exam day.',
      actionLabel: 'Learn More →',
      actionTo: '/analytics',
      image: '/assets/images/student-grade-review.jpg',
      imageAlt: 'Student reviewing positive test score improvements and accuracy analytics',
    },
  ];

  return (
    <section className="section" id="benefits" aria-label="Key Product Benefits">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <span className="eyebrow">Proven Features</span>
          <h2>Why Students Choose MarkDriller</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Built specifically for Nigerian candidates to bridge classroom learning and computer-based examination success.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginTop: '28px',
          }}
        >
          {benefits.map((item) => (
            <div
              key={item.id}
              className="mk-card mk-card-hover"
              onClick={() => handleBenefitClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBenefitClick(item);
                }
              }}
              style={{
                backgroundColor: 'var(--white)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              }}
            >
              <div>
                <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px', background: 'var(--paper)' }}>
                  <SafeImage
                    src={item.image}
                    alt={item.imageAlt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  {item.description}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBenefitClick(item);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--rust)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {item.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Motivating Student Preparation Callout Banner */}
        <div
          style={{
            marginTop: '32px',
            padding: '20px 24px',
            borderRadius: '12px',
            background: 'var(--paper)',
            border: '1.5px solid var(--paper-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h4 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
              Practise Today. Prepare for Tomorrow.
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>
              Build your confidence, one practice session at a time, with verified past questions and diagnostic analytics.
            </p>
          </div>
          <button
            type="button"
            className="btn-custom btn-custom-primary"
            style={{ fontSize: '13px', padding: '9px 18px', fontWeight: 700 }}
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('signup');
              } else {
                navigate('/portal/cbt');
              }
            }}
          >
            Start Free Practice Session →
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhatWeOffer;
