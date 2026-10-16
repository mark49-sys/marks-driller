import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useExamBoards } from '../api/useExamBoards.js';
import { ExamBoardLogo } from './ExamBoardLogo.js';

export interface ExamBoardItem {
  id: string;
  shortCode: string;
  officialName: string;
  badge: string;
  description: string;
  defaultExamCode: string;
}

export const SUPPORTED_EXAM_BOARDS: ExamBoardItem[] = [
  {
    id: 'jamb',
    shortCode: 'JAMB / UTME',
    officialName: 'Joint Admissions and Matriculation Board',
    badge: 'Matriculation CBT',
    description: '4-subject combination with official 8-key keyboard controls and 120-minute simulation.',
    defaultExamCode: 'JAMB',
  },
  {
    id: 'waec',
    shortCode: 'WAEC',
    officialName: 'West African Senior School Certificate Examination',
    badge: 'SSCE May/June & GCE',
    description: 'Senior Secondary objective papers across Science, Arts, and Commercial subjects with Chief Examiner remarks.',
    defaultExamCode: 'WAEC',
  },
  {
    id: 'neco',
    shortCode: 'NECO',
    officialName: 'National Examinations Council',
    badge: 'National SSCE',
    description: 'Indigenous Nigerian secondary curriculum test papers with detailed step-by-step solutions.',
    defaultExamCode: 'NECO',
  },
  {
    id: 'gce',
    shortCode: 'GCE',
    officialName: 'General Certificate of Education',
    badge: 'Private Candidate Series',
    description: 'Nov/Dec external series for remedial candidates and private O-Level credit completion.',
    defaultExamCode: 'GCE',
  },
  {
    id: 'post-utme',
    shortCode: 'POST-UTME',
    officialName: 'Nigerian Universities Screening & Aptitude CBT',
    badge: 'Tertiary Screening',
    description: 'High-speed aptitude tests calibrated to top universities (UNILAG, UI, OAU, UNIBEN, UNN).',
    defaultExamCode: 'POST-UTME',
  },
  {
    id: 'nabteb',
    shortCode: 'NABTEB',
    officialName: 'National Business & Technical Examinations Board',
    badge: 'Technical & Trade',
    description: 'Accredited technical trade, business, and vocational examination curriculum papers.',
    defaultExamCode: 'NABTEB',
  },
];

export const ExamBoards: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedExamBoard, openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: boardsData } = useExamBoards();
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const filteredCards =
    filterMode === 'ALL'
      ? SUPPORTED_EXAM_BOARDS
      : SUPPORTED_EXAM_BOARDS.filter((c) => c.shortCode === filterMode || c.id === filterMode);

  const handleStartCbt = (examCode: string) => {
    setSelectedExamBoard(examCode);
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate(`/portal/cbt?exam=${encodeURIComponent(examCode)}`);
    }
  };

  const handlePastQuestions = (examCode: string) => {
    setSelectedExamBoard(examCode);
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate(`/questions?exam=${encodeURIComponent(examCode)}`);
    }
  };

  return (
    <section className="boards section" id="exam-boards" aria-label="Official Nigerian Examination Boards">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Supported Curricula</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(168, 86, 47, 0.12)',
                color: 'var(--rust)',
                fontWeight: 600,
              }}
            >
              6 Accredited Exam Suites
            </span>
          </div>
          <h2>Select Your Target Examination</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Choose your examination board to practice solved past questions, take timed CBT mocks, and prepare with curriculum-verified tests.
          </p>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`btn-custom ${filterMode === 'ALL' ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
          >
            All 6 Examinations
          </button>
          {SUPPORTED_EXAM_BOARDS.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => setFilterMode(board.shortCode)}
              className={`btn-custom ${filterMode === board.shortCode ? 'btn-custom-primary' : 'btn-custom-ghost'}`}
              style={{ fontSize: '12.5px', padding: '6px 12px' }}
            >
              {board.shortCode}
            </button>
          ))}
        </div>

        {/* Compact Examination Cards Grid */}
        <div className="exam-boards-grid-3col">
          {filteredCards.map((card) => {
            const dbBoard = boardsData?.find(
              (b) => b.shortCode === card.defaultExamCode || b.shortCode === card.shortCode
            );
            const questionCountStr = dbBoard
              ? `${dbBoard.questionCount.toLocaleString()} Questions`
              : 'Curriculum-Verified';

            return (
              <div
                key={card.id}
                className="exam-board-suite-card mk-card mk-card-hover"
                style={{
                  background: 'var(--white)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '22px',
                  boxShadow: 'var(--card-shadow)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                  alignSelf: 'stretch',
                }}
              >
                <div>
                  {/* Top Bar with Logo & Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <ExamBoardLogo board={card.defaultExamCode} size={42} />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--paper)',
                        color: 'var(--rust)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--paper-line)',
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>

                  {/* Title & Authority */}
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      margin: '0 0 4px 0',
                      color: 'var(--ink)',
                      lineHeight: 1.3,
                    }}
                  >
                    {card.shortCode}
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '11.5px',
                      color: 'var(--ink-soft)',
                      display: 'block',
                      marginBottom: '10px',
                    }}
                  >
                    {card.officialName}
                  </span>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--ink)',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0',
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                <div>
                  {/* Stats Tag */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--paper-line)',
                      marginBottom: '14px',
                      fontSize: '11.5px',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <span style={{ color: 'var(--ink-soft)' }}>Status:</span>
                    <strong style={{ color: 'var(--forest)' }}>{questionCountStr}</strong>
                  </div>

                  {/* Direct Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartCbt(card.defaultExamCode)}
                      className="btn-custom btn-custom-primary"
                      style={{
                        fontSize: '12px',
                        padding: '8px 10px',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                      title={`Simulate ${card.shortCode} CBT exam`}
                    >
                      ⏱️ CBT Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePastQuestions(card.defaultExamCode)}
                      className="btn-custom btn-custom-ghost"
                      style={{
                        fontSize: '12px',
                        padding: '8px 10px',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                      title={`Browse ${card.shortCode} past questions`}
                    >
                      📖 Past Questions
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statutory Attribution Disclaimer */}
        <div
          style={{
            marginTop: '32px',
            padding: '14px 18px',
            backgroundColor: 'var(--white)',
            borderRadius: '8px',
            border: '1px solid var(--paper-line)',
            borderLeft: '4px solid var(--amber)',
            fontSize: '12px',
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--ink)' }}>Statutory Notice &amp; Independent Attribution:</strong>{' '}
          MarkDriller is an independent Nigerian educational examination-preparation platform. Registered examination acronyms and official names (JAMB, WAEC, NECO, NABTEB) are property of their respective statutory examination bodies, referenced solely for syllabus identification and candidate preparation under fair dealing principles.
        </div>
      </div>
    </section>
  );
};

export default ExamBoards;
