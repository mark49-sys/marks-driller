import React, { useState } from 'react';
import {
  useAdminPricingQuery,
  useAdminPriceAuditQuery,
  useAdminUpdatePlanPriceMutation,
  type AdminPlanPrice,
} from '../api/admin.js';
import { formatKoboAsNaira } from '../api/subscriptions.js';
import { BrandLoader } from './BrandLoader.js';

type Draft = { amount?: string; enabled?: boolean };
type Notice = { type: 'success' | 'error'; text: string };

// Mirrors the server rule: whole naira up to 8 digits, optional 1-2 decimals. The server re-validates everything.
const NAIRA_INPUT_PATTERN = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  fontFamily: 'var(--font-sans)',
  marginBottom: '5px',
  textTransform: 'uppercase',
  color: 'var(--slate)',
};

export const AdminPricingSettings: React.FC = () => {
  const pricingQuery = useAdminPricingQuery();
  const auditQuery = useAdminPriceAuditQuery(10);
  const updateMutation = useAdminUpdatePlanPriceMutation();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  const setDraft = (planId: string, patch: Draft) =>
    setDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], ...patch } }));

  const clearDraft = (planId: string) =>
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[planId];
      return next;
    });

  const setNotice = (planId: string, notice: Notice | null) =>
    setNotices((prev) => {
      const next = { ...prev };
      if (notice) next[planId] = notice;
      else delete next[planId];
      return next;
    });

  const handleSave = async (plan: AdminPlanPrice) => {
    const draft = drafts[plan.planId] ?? {};
    const amount = (draft.amount ?? plan.amountNGN ?? '').trim();
    const enabled = draft.enabled ?? plan.enabled;

    if (!NAIRA_INPUT_PATTERN.test(amount)) {
      setNotice(plan.planId, {
        type: 'error',
        text: 'Enter a valid positive amount with at most 2 decimal places (for example 3500 or 3500.50).',
      });
      return;
    }

    setSavingPlan(plan.planId);
    setNotice(plan.planId, null);
    try {
      const result = await updateMutation.mutateAsync({
        planId: plan.planId,
        amountNGN: amount,
        enabled,
        expectedVersion: plan.version,
      });
      clearDraft(plan.planId);
      setNotice(plan.planId, {
        type: 'success',
        text: result.changed
          ? `Saved. New price ${formatKoboAsNaira(result.price.amountKobo)} is now live for new payments.`
          : 'No changes to save.',
      });
    } catch (err: unknown) {
      setNotice(plan.planId, {
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save the price. Please try again.',
      });
      // A version conflict means someone else edited it: pull the latest values.
      pricingQuery.refetch();
    } finally {
      setSavingPlan(null);
    }
  };

  const plans = pricingQuery.data?.plans ?? [];

  return (
    <div
      className="mk-card"
      id="admin-pricing-settings"
      style={{
        background: 'var(--white)',
        border: '1.5px solid var(--paper-line)',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <span style={{ fontSize: '20px' }}>💳</span>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', margin: 0, color: 'var(--ink)' }}>
          Pricing and Money Settings
        </h3>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-sans)',
            background: 'var(--forest-soft)',
            color: 'var(--forest)',
            border: '1px solid var(--forest)',
            padding: '2px 8px',
            borderRadius: '3px',
            fontWeight: 700,
          }}
        >
          DATABASE DYNAMIC
        </span>
      </div>
      <p style={{ color: 'var(--slate)', fontSize: '13.5px', margin: '0 0 20px', maxWidth: '760px' }}>
        Edit what students are charged for each plan. Saved prices apply to every new checkout immediately. Payments
        that were already started keep the amount they were created with.
      </p>

      {pricingQuery.isLoading ? (
        <div style={{ padding: '36px', textAlign: 'center' }}>
          <BrandLoader mode="inline" size="sm" message="Loading saved prices..." />
        </div>
      ) : pricingQuery.isError ? (
        <div style={{ padding: '14px 16px', background: 'var(--rust-soft)', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '13px' }}>
          Could not load prices: {pricingQuery.error instanceof Error ? pricingQuery.error.message : 'unknown error'}
          <button
            type="button"
            onClick={() => pricingQuery.refetch()}
            className="btn-custom btn-custom-ghost"
            style={{ marginLeft: '12px', padding: '4px 10px', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
          {plans.map((plan) => {
            const draft = drafts[plan.planId];
            const amountValue = draft?.amount ?? plan.amountNGN ?? '';
            const enabledValue = draft?.enabled ?? plan.enabled;
            const isDirty =
              draft !== undefined &&
              ((draft.amount !== undefined && draft.amount.trim() !== (plan.amountNGN ?? '')) ||
                (draft.enabled !== undefined && draft.enabled !== plan.enabled));
            const isSaving = savingPlan === plan.planId;
            const notice = notices[plan.planId];
            const isMissing = plan.version === 0;

            return (
              <div
                key={plan.planId}
                id={`pricing-plan-${plan.planId.toLowerCase()}`}
                style={{
                  background: 'var(--paper)',
                  border: `1.5px solid ${isDirty ? 'var(--rust)' : 'var(--cream-deep)'}`,
                  borderRadius: '6px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{plan.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{plan.billingPeriod}</div>
                </div>

                {isMissing && (
                  <div style={{ fontSize: '12px', color: 'var(--rust)', fontWeight: 600 }}>
                    No price saved yet — students cannot buy this plan until you save one.
                  </div>
                )}

                <div>
                  <label htmlFor={`price-input-${plan.planId}`} style={labelStyle}>
                    Price ({plan.currency})
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        background: 'var(--cream-deep)',
                        border: '1.5px solid var(--ink)',
                        borderRight: 'none',
                        borderRadius: '3px 0 0 3px',
                        fontWeight: 700,
                      }}
                      aria-hidden="true"
                    >
                      ₦
                    </span>
                    <input
                      id={`price-input-${plan.planId}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={amountValue}
                      disabled={isSaving}
                      onChange={(e) => setDraft(plan.planId, { amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1.5px solid var(--ink)',
                        borderRadius: '0 3px 3px 0',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '16px',
                        fontWeight: 700,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enabledValue}
                    disabled={isSaving}
                    onChange={(e) => setDraft(plan.planId, { enabled: e.target.checked })}
                  />
                  Available for purchase
                </label>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    id={`save-price-${plan.planId.toLowerCase()}`}
                    onClick={() => handleSave(plan)}
                    disabled={!isDirty || isSaving}
                    className="btn-custom btn-custom-primary"
                    style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, opacity: !isDirty || isSaving ? 0.55 : 1 }}
                  >
                    {isSaving ? 'Saving...' : 'Save Price'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearDraft(plan.planId);
                      setNotice(plan.planId, null);
                    }}
                    disabled={!isDirty || isSaving}
                    className="btn-custom btn-custom-ghost"
                    style={{ padding: '9px 18px', fontSize: '13px', opacity: !isDirty || isSaving ? 0.55 : 1 }}
                  >
                    Cancel
                  </button>
                </div>

                {notice && (
                  <div
                    role={notice.type === 'error' ? 'alert' : 'status'}
                    style={{
                      fontSize: '12.5px',
                      padding: '8px 10px',
                      background: notice.type === 'success' ? 'var(--forest-soft)' : 'var(--rust-soft)',
                      border: `1px solid ${notice.type === 'success' ? 'var(--forest)' : 'var(--rust)'}`,
                      color: notice.type === 'success' ? 'var(--forest)' : 'var(--rust)',
                    }}
                  >
                    {notice.text}
                  </div>
                )}

                <div style={{ fontSize: '11.5px', color: 'var(--slate)', fontFamily: 'var(--font-sans)' }}>
                  {plan.updatedAt
                    ? `Last updated ${new Date(plan.updatedAt).toLocaleString('en-GB')}${plan.updatedBy ? ` by ${plan.updatedBy.fullName || plan.updatedBy.email}` : ''}`
                    : 'Never updated'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', margin: '0 0 10px', color: 'var(--ink)' }}>
          Recent price changes
        </h4>
        {auditQuery.isLoading ? (
          <div style={{ fontSize: '12px', color: 'var(--slate)' }}>Loading history...</div>
        ) : (auditQuery.data?.entries.length ?? 0) === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--slate)' }}>No price changes recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--ink)' }}>
                  <th style={{ padding: '6px 8px' }}>When</th>
                  <th style={{ padding: '6px 8px' }}>Plan</th>
                  <th style={{ padding: '6px 8px' }}>Previous</th>
                  <th style={{ padding: '6px 8px' }}>New</th>
                  <th style={{ padding: '6px 8px' }}>Admin</th>
                  <th style={{ padding: '6px 8px' }}>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data!.entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--cream-deep)' }}>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{new Date(entry.createdAt).toLocaleString('en-GB')}</td>
                    <td style={{ padding: '6px 8px' }}>{entry.planId}</td>
                    <td style={{ padding: '6px 8px' }}>{formatKoboAsNaira(entry.previousAmountKobo)}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>
                      {formatKoboAsNaira(entry.newAmountKobo)}
                      {entry.newEnabled ? '' : ' (disabled)'}
                    </td>
                    <td style={{ padding: '6px 8px' }}>{entry.adminEmail || '—'}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{entry.requestId.slice(0, 13)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
