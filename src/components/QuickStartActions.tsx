import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { ExamBoardLogo } from './ExamBoardLogo.js';
import { SafeImage } from './SafeImage.js';

interface QuickActionItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  boardCode: string;
  type: 'cbt' | 'questions';
  image: string;
  imageAlt: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'jamb-cbt',
    badge: 'Real CBT Simulation',
    title: 'JAMB CBT Practice Test',
    description: 'Official 4-subject combination, 8-key keyboard controls (A, B, C, D, P, N, S, R) and live 120-minute timer.',
    actionLabel: 'Start JAMB CBT Test →',
    boardCode: 'JAMB',
    type: 'cbt',
    image: '/assets/images/cbt-student-lab.jpg',
    imageAlt: 'Focused student practicing JAMB CBT on computer in examination hall',
  },
  {
    id: 'waec-pq',
    badge: 'Accredited SSCE Bank',
    title: 'WAEC Past Questions',
    description: 'Browse verified May/June and GCE objective papers across Mathematics, English, Sciences, and Arts with full solutions.',
    actionLabel: 'Practice WAEC Questions →',
    boardCode: 'WAEC',
    type: 'questions',
    image: '/assets/images/collaborative-learning.jpg',
    imageAlt: 'Students reviewing WAEC examination papers and syllabus topics together',
  },
  {
    id: 'neco-pq',
    badge: 'National Examination Papers',
    title: 'NECO Past Questions',
    description: 'Step-by-step solutions and Chief Examiner remarks covering Nigerian national curriculum syllabus papers.',
    actionLabel: 'Practice NECO Questions →',
    boardCode: 'NECO',
    type: 'questions',
    image: '/assets/images/classroom-study.jpg',
    imageAlt: 'Students in classroom preparing for NECO national examinations',
  },
  {
    id: 'start-cbt',
    badge: 'Universal Exam Engine',
    title: 'Start CBT Practice',
    description: 'Choose your subject combinations, set custom countdown limits, and simulate exam hall test conditions instantly.',
    actionLabel: 'Launch CBT Engine →',
    boardCode: '',
    type: 'cbt',
    image: '/assets/images/digital-cbt.jpg',
    imageAlt: 'Authentic online CBT computer test interface and timer simulation',
  },
];

export const QuickStartActions: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();

  const handleActionClick = (action: QuickActionItem) => {
    if (!isAuthenticated) {
      openAuthModal('signup');
      return;
    }

    if (action.type === 'cbt') {
      const query = action.boardCode ? `?exam=${encodeURIComponent(action.boardCode)}` : '';
      navigate(`/portal/cbt${query}`);
    } else {
      const query = action.boardCode ? `?exam=${encodeURIComponent(action.boardCode)}` : '';
      navigate(`/questions${query}`);
    }
  };

  return (
    <section className="section quick-start-section" id="quick-start" aria-label="Quick-Start CBT Practice Actions">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <span className="eyebrow">Direct Examination Actions</span>
          <h2>Start Practising Immediately</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Jump straight into authentic computer-based test simulations or browse solved curriculum past questions with zero friction.
          </p>
        </div>

        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((item) => (
            <div
              key={item.id}
              className="quick-action-card mk-card mk-card-hover"
              onClick={() => handleActionClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleActionClick(item);
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                borderRadius: '12px',
                border: '1.5px solid var(--paper-line)',
                background: 'var(--white)',
                boxShadow: 'var(--card-shadow)',
                position: 'relative',
                overflow: 'hidden',
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: item.type === 'cbt' ? 'var(--rust, #a8562f)' : 'var(--forest, #225a38)',
                      backgroundColor: item.type === 'cbt' ? 'rgba(168, 86, 47, 0.1)' : 'rgba(34, 90, 56, 0.1)',
                      padding: '3px 9px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.badge}
                  </span>
                  {item.boardCode && (
                    <ExamBoardLogo board={item.boardCode} size={28} />
                  )}
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 20px 0' }}>
                  {item.description}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className={`btn-custom ${item.type === 'cbt' ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    padding: '10px 16px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(item);
                  }}
                >
                  {item.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStartActions;
