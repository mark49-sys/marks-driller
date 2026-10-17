import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSubscriptionPlansQuery, formatKoboAsNaira } from '../api/subscriptions.js';

export const SubscriptionTiersPreview: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: livePlans } = useSubscriptionPlansQuery();

  const monthlyPlan = livePlans?.find((p) => p.id === 'PRO_MONTHLY');
  const bimonthlyPlan = livePlans?.find((p) => p.id === 'PRO_BIMONTHLY');

  const handleFreeAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  const handleProAction = () => {
    if (!isAuthenticated) {
      openAuthModal('signup');
    } else {
      navigate('/portal/pricing');
    }
  };

  return (
    <section className="section" id="pricing-preview" aria-label="Transparent Subscription Plans">
      <div id="pricing" style={{ position: 'relative', top: '-1px', height: 0, overflow: 'hidden' }} aria-hidden="true" />
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Fair Nigerian Pricing</span>
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
              Zero Hidden Charges
            </span>
          </div>
          <h2>Clear, Student-Friendly Access</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Start completely free or upgrade to the full question bank with unlimited CBT mocks and analytics.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'stretch',
            marginBottom: '28px',
          }}
        >
          {/* Tier 1: Free Starter */}
          <div
            className="mk-card mk-card-hover"
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              STARTER EXPLORER
            </span>
            <h3 style={{ fontSize: '19px', margin: '0 0 10px 0', color: 'var(--ink)' }}>
              Free Starter
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '14px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                ₦0
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                / free to start
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Perfect for every new student testing practice questions and exploring the CBT engine.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 22px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.65,
                flex: 1,
              }}
            >
              <li>200 free trial questions with solutions</li>
              <li>3 full CBT examination sessions</li>
              <li>Official JAMB &amp; WAEC syllabus outlines</li>
              <li>Instant auto-marking and score review</li>
            </ul>

            <button
              type="button"
              onClick={handleFreeAction}
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', fontSize: '13px', padding: '10px', textAlign: 'center', justifyContent: 'center' }}
            >
              Start Free Practice
            </button>
          </div>

          {/* Tier 2: Pro Candidate Pass */}
          <div
            className="mk-card mk-card-featured"
            style={{
              background: 'var(--white)',
              border: '2px solid var(--rust)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(168, 86, 47, 0.15)',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '18px',
                backgroundColor: 'var(--rust)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}
            >
              RECOMMENDED
            </div>

            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--rust)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              INDIVIDUAL SCHOLAR PASS
            </span>
            <h3 style={{ fontSize: '19px', margin: '0 0 10px 0', color: 'var(--ink)' }}>
              Pro Candidate Pass
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '14px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                {formatKoboAsNaira(monthlyPlan?.priceKobo)}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                / month{bimonthlyPlan?.priceKobo != null ? ` (or ${formatKoboAsNaira(bimonthlyPlan.priceKobo)} for 2 mos)` : ''}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Everything an aspiring candidate needs for maximum score readiness in JAMB, WAEC, and NECO.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 22px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.65,
                flex: 1,
              }}
            >
              <li><strong>Unlimited access to 4,200+ verified questions</strong></li>
              <li><strong>Unlimited full-length timed CBT mocks</strong></li>
              <li><strong>Step-by-step worked solutions &amp; examiner notes</strong></li>
              <li><strong>Diagnostic score breakdown &amp; speed analytics</strong></li>
              <li><strong>Bookmark difficult questions for revision</strong></li>
            </ul>

            <button
              type="button"
              onClick={handleProAction}
              className="btn-custom btn-custom-primary"
              style={{ width: '100%', fontSize: '13.5px', padding: '11px', textAlign: 'center', justifyContent: 'center' }}
            >
              Upgrade to Pro Now →
            </button>
          </div>

          {/* Tier 3: School & Centre License */}
          <div
            className="mk-card mk-card-hover"
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--steel)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              INSTITUTIONS &amp; CBT LABS
            </span>
            <h3 style={{ fontSize: '19px', margin: '0 0 10px 0', color: 'var(--ink)' }}>
              School &amp; Center License
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '14px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                Institutional
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                tiered volume
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              For schools, tutorial colleges, and commercial CBT centers conducting large-scale student testing.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 22px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.65,
                flex: 1,
              }}
            >
              <li>Deploy across 50 to 500+ student computers</li>
              <li>JAMB, WAEC, and NECO accredited curricula</li>
              <li>Batch student score analytics &amp; performance reports</li>
              <li>Priority technical onboarding &amp; dedicated support</li>
            </ul>

            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', fontSize: '13px', padding: '10px', textAlign: 'center', justifyContent: 'center' }}
            >
              Contact Institutional Desk ➔
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionTiersPreview;
