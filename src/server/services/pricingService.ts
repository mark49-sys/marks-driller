import { Types } from 'mongoose';
import {
  PlanPrice,
  PAID_PLAN_IDS,
  SUPPORTED_CURRENCIES,
  MIN_PRICE_KOBO,
  MAX_PRICE_KOBO,
  type PaidPlanId,
  type SupportedCurrency,
} from '../models/PlanPrice.js';
import { PriceChangeAudit, type PriceChangeType } from '../models/PriceChangeAudit.js';

export { PAID_PLAN_IDS, MIN_PRICE_KOBO, MAX_PRICE_KOBO };
export type { PaidPlanId, SupportedCurrency };

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class PricingError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'PricingError';
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Money helpers — integer kobo only; no floating-point arithmetic on currency.
// ---------------------------------------------------------------------------
const NAIRA_PATTERN = /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/;

/**
 * Converts a user-facing naira amount ("3500", "3500.5", 3500) to integer kobo.
 * Returns null for anything malformed, negative, exponent-formatted or oversized.
 */
export function parseNairaToKobo(input: unknown): number | null {
  let text = '';
  if (typeof input === 'number') {
    text = Number.isFinite(input) ? String(input) : '';
  } else if (typeof input === 'string') {
    text = input.trim();
  }
  if (!NAIRA_PATTERN.test(text)) return null;

  const [whole, fraction = ''] = text.split('.');
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) ? kobo : null;
}

export function koboToNairaString(kobo: number): string {
  const whole = Math.floor(kobo / 100);
  const fraction = kobo % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

export function isValidPriceKobo(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= MIN_PRICE_KOBO &&
    value <= MAX_PRICE_KOBO
  );
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === 'string' && (PAID_PLAN_IDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Static, non-monetary plan catalogue (names, copy, duration).
// Prices are intentionally NOT stored here.
// ---------------------------------------------------------------------------
interface CatalogEntry {
  name: string;
  billingPeriod: string;
  description: string;
  features: string[];
  isPopular: boolean;
  durationDays: number;
}

const QUARTERLY_SAVINGS_TOKEN = '{{QUARTERLY_SAVINGS}}';

const PAID_PLAN_CATALOG: Record<PaidPlanId, CatalogEntry> = {
  PRO_MONTHLY: {
    name: '1 Month Pro Pass',
    billingPeriod: '1 Month',
    description: 'Complete high-stakes preparation suite for JAMB / UTME and WAEC candidates.',
    features: [
      'Unlimited CBT examinations with official timer',
      'Full question bank access (all years 2015–2025)',
      'Detailed step-by-step worked mathematical solutions',
      'In-depth syllabus topic mastery & weakness analytics',
      'Downloadable curriculum notes and revision summaries',
    ],
    isPopular: false,
    durationDays: 30,
  },
  PRO_BIMONTHLY: {
    name: '2 Months Intensive Pass',
    billingPeriod: '2 Months (Fixed Duration)',
    description: 'Two-month dedicated preparation pass for exam revision and multi-subject mocks.',
    features: [
      'All Pro features for a fixed 60-day period',
      'Multi-year past question pooling (2015–2025)',
      'Advanced timing & question shuffle options',
      'Complete worked solutions & step-by-step rationales',
      'Full performance analytics & weakness diagnostics',
    ],
    isPopular: true,
    durationDays: 60,
  },
  PRO_QUARTERLY: {
    name: '3 Months Term Scholar',
    billingPeriod: '3 Months (Quarterly)',
    description: 'Complete academic term syllabus coverage for secondary & UTME candidates.',
    features: [
      'All Pro features for full 90-day term',
      'Unlimited CBT timed examinations',
      'Priority offline study material access',
      'Topic-by-topic mastery tracking',
      QUARTERLY_SAVINGS_TOKEN,
    ],
    isPopular: false,
    durationDays: 90,
  },
  PRO_ANNUAL: {
    name: '1 Year Annual Scholar',
    billingPeriod: '1 Year',
    description: 'Full-year comprehensive coverage for Post-UTME, WAEC, NECO and university admissions.',
    features: [
      'All Pro features included for 365 days',
      'Post-UTME university-specific screening drills',
      'Offline PDF download bundles for all subjects',
      'Dedicated academic counseling webinars',
      'Guaranteed syllabus updates for 2026/2027 sessions',
    ],
    isPopular: false,
    durationDays: 365,
  },
};

const FREE_PLAN = {
  id: 'FREE' as const,
  name: 'Free Starter',
  billingPeriod: 'Forever Free',
  description: 'Essential revision tools for secondary students beginning exam prep.',
  features: [
    'Strict 3 Free Trial examination attempts',
    'Year 2024 Past Questions included across all subjects',
    'Basic student dashboard & score history',
    'Instant result slip & score overview',
  ],
};

export function getPlanName(planId: string): string {
  if (planId === 'FREE') return FREE_PLAN.name;
  return isPaidPlanId(planId) ? PAID_PLAN_CATALOG[planId].name : planId;
}

export function getPlanDurationDays(planId: string): number {
  return isPaidPlanId(planId) ? PAID_PLAN_CATALOG[planId].durationDays : 30;
}

// ---------------------------------------------------------------------------
// Price reads (always from the database)
// ---------------------------------------------------------------------------
export interface ResolvedPlanPrice {
  planId: PaidPlanId;
  amountKobo: number;
  currency: SupportedCurrency;
  version: number;
}

function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/**
 * Resolves the authoritative, currently chargeable price for a plan.
 * Throws instead of ever falling back to a default amount.
 */
export async function getChargeablePlanPrice(planId: string): Promise<ResolvedPlanPrice> {
  if (!isPaidPlanId(planId)) {
    throw new PricingError(400, 'INVALID_PLAN', 'Invalid subscription tier.');
  }

  const record = await PlanPrice.findOne({ planId }).lean();

  if (!record || !isValidPriceKobo(record.amountKobo) || !isSupportedCurrency(record.currency)) {
    throw new PricingError(
      503,
      'PRICE_UNAVAILABLE',
      'The price for this plan is temporarily unavailable. Please try again shortly or contact support.'
    );
  }

  if (!record.enabled) {
    throw new PricingError(409, 'PLAN_DISABLED', 'This plan is not currently available for purchase.');
  }

  return {
    planId,
    amountKobo: record.amountKobo,
    currency: record.currency,
    version: record.version,
  };
}

export interface PublicPlan {
  id: 'FREE' | PaidPlanId;
  name: string;
  priceNGN: number | null;
  priceKobo: number | null;
  currency: string;
  billingPeriod: string;
  description: string;
  features: string[];
  isPopular: boolean;
  purchasable: boolean;
}

export async function listPublicPlans(): Promise<PublicPlan[]> {
  const records = await PlanPrice.find({ planId: { $in: PAID_PLAN_IDS as unknown as string[] } }).lean();
  const byId = new Map(records.map((r) => [r.planId as PaidPlanId, r]));

  const validKobo = (id: PaidPlanId): number | null => {
    const r = byId.get(id);
    return r && isValidPriceKobo(r.amountKobo) && isSupportedCurrency(r.currency) ? r.amountKobo : null;
  };

  const monthly = validKobo('PRO_MONTHLY');
  const quarterly = validKobo('PRO_QUARTERLY');

  const plans: PublicPlan[] = [
    {
      id: 'FREE',
      name: FREE_PLAN.name,
      priceNGN: 0,
      priceKobo: 0,
      currency: 'NGN',
      billingPeriod: FREE_PLAN.billingPeriod,
      description: FREE_PLAN.description,
      features: FREE_PLAN.features,
      isPopular: false,
      purchasable: false,
    },
  ];

  for (const id of PAID_PLAN_IDS) {
    const entry = PAID_PLAN_CATALOG[id];
    const record = byId.get(id);
    const kobo = validKobo(id);

    let billingPeriod = entry.billingPeriod;
    // Marketing claims derived from live prices so they can never drift from them.
    if (id === 'PRO_ANNUAL' && kobo !== null && monthly !== null) {
      const yearlyAtMonthlyRate = monthly * 12;
      const savingPercent = Math.floor(((yearlyAtMonthlyRate - kobo) * 100) / yearlyAtMonthlyRate);
      if (savingPercent >= 1) billingPeriod = `${entry.billingPeriod} (Save ${savingPercent}%)`;
    }

    const features: string[] = [];
    for (const feature of entry.features) {
      if (feature === QUARTERLY_SAVINGS_TOKEN) {
        if (quarterly !== null && monthly !== null) {
          const savingKobo = monthly * 3 - quarterly;
          if (savingKobo > 0) {
            features.push(`Save ₦${(savingKobo / 100).toLocaleString('en-NG')} compared to monthly renewal`);
          }
        }
        continue;
      }
      features.push(feature);
    }

    plans.push({
      id,
      name: entry.name,
      priceNGN: kobo === null ? null : kobo / 100,
      priceKobo: kobo,
      currency: record?.currency ?? 'NGN',
      billingPeriod,
      description: entry.description,
      features,
      isPopular: entry.isPopular,
      purchasable: kobo !== null && record?.enabled === true,
    });
  }

  return plans;
}

// ---------------------------------------------------------------------------
// Admin reads / writes
// ---------------------------------------------------------------------------
export interface AdminPlanPrice {
  planId: PaidPlanId;
  name: string;
  billingPeriod: string;
  amountKobo: number | null;
  amountNGN: string | null;
  currency: string;
  enabled: boolean;
  /** 0 means "no saved record yet". */
  version: number;
  updatedAt: Date | null;
  updatedBy: { id: string; fullName: string; email: string } | null;
}

export async function getAdminPricing(): Promise<AdminPlanPrice[]> {
  const records = await PlanPrice.find({ planId: { $in: PAID_PLAN_IDS as unknown as string[] } })
    .populate('updatedBy', 'fullName email')
    .lean();
  const byId = new Map(records.map((r) => [r.planId as PaidPlanId, r]));

  return PAID_PLAN_IDS.map((planId) => {
    const r = byId.get(planId);
    const updater = r?.updatedBy as unknown as { _id: Types.ObjectId; fullName: string; email: string } | undefined;
    return {
      planId,
      name: PAID_PLAN_CATALOG[planId].name,
      billingPeriod: PAID_PLAN_CATALOG[planId].billingPeriod,
      amountKobo: r && isValidPriceKobo(r.amountKobo) ? r.amountKobo : null,
      amountNGN: r && isValidPriceKobo(r.amountKobo) ? koboToNairaString(r.amountKobo) : null,
      currency: r?.currency ?? 'NGN',
      enabled: r?.enabled ?? false,
      version: r?.version ?? 0,
      updatedAt: r?.updatedAt ?? null,
      updatedBy:
        updater && typeof updater === 'object' && 'email' in updater
          ? { id: String(updater._id), fullName: updater.fullName, email: updater.email }
          : null,
    };
  });
}

export async function listPriceAudit(options: { planId?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const filter = options.planId && isPaidPlanId(options.planId) ? { planId: options.planId } : {};
  const rows = await PriceChangeAudit.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((row) => ({
    id: String(row._id),
    planId: row.planId,
    changeType: row.changeType,
    previousAmountKobo: row.previousAmountKobo,
    newAmountKobo: row.newAmountKobo,
    previousEnabled: row.previousEnabled,
    newEnabled: row.newEnabled,
    currency: row.currency,
    resultingVersion: row.resultingVersion,
    adminEmail: row.adminEmail ?? null,
    requestId: row.requestId,
    createdAt: row.createdAt,
  }));
}

export interface UpdatePlanPriceInput {
  planId: PaidPlanId;
  amountKobo: number;
  enabled?: boolean;
  /** Version the admin was looking at; 0 when no record exists yet. */
  expectedVersion: number;
  adminId: Types.ObjectId;
  adminEmail: string;
  requestId: string;
}

export interface UpdatePlanPriceResult {
  changed: boolean;
  requestId: string;
  price: AdminPlanPrice;
}

function describeChange(amountChanged: boolean, enabledChanged: boolean): PriceChangeType {
  if (amountChanged && enabledChanged) return 'PRICE_AND_ENABLED';
  return amountChanged ? 'PRICE' : 'ENABLED';
}

async function loadAdminPrice(planId: PaidPlanId): Promise<AdminPlanPrice> {
  const all = await getAdminPricing();
  return all.find((p) => p.planId === planId)!;
}

export async function updatePlanPrice(input: UpdatePlanPriceInput): Promise<UpdatePlanPriceResult> {
  const { planId, amountKobo, expectedVersion, adminId, adminEmail, requestId } = input;

  if (!isPaidPlanId(planId)) {
    throw new PricingError(400, 'INVALID_PLAN', 'Invalid subscription tier.');
  }
  if (!isValidPriceKobo(amountKobo)) {
    throw new PricingError(400, 'INVALID_AMOUNT', 'Amount is outside the permitted range.');
  }

  const current = await PlanPrice.findOne({ planId }).lean();
  const currentVersion = current?.version ?? 0;

  if (currentVersion !== expectedVersion) {
    throw new PricingError(
      409,
      'STALE_VERSION',
      'This price was changed by someone else. Reload the latest value and try again.'
    );
  }

  const nextEnabled = input.enabled ?? current?.enabled ?? true;

  // No-op: nothing to persist or audit.
  if (current && current.amountKobo === amountKobo && current.enabled === nextEnabled) {
    return { changed: false, requestId, price: await loadAdminPrice(planId) };
  }

  let saved;
  if (!current) {
    try {
      saved = await PlanPrice.create({
        planId,
        amountKobo,
        currency: 'NGN',
        enabled: nextEnabled,
        version: 1,
        updatedBy: adminId,
        description: `${PAID_PLAN_CATALOG[planId].name} price`,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new PricingError(409, 'STALE_VERSION', 'This price was created by someone else. Reload and try again.');
      }
      throw error;
    }
  } else {
    // Compare-and-swap on version: a concurrent writer makes this return null.
    saved = await PlanPrice.findOneAndUpdate(
      { planId, version: expectedVersion },
      { $set: { amountKobo, enabled: nextEnabled, updatedBy: adminId }, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!saved) {
      throw new PricingError(
        409,
        'STALE_VERSION',
        'This price was changed by someone else. Reload the latest value and try again.'
      );
    }
  }

  try {
    await PriceChangeAudit.create({
      planId,
      changeType: describeChange(!current || current.amountKobo !== amountKobo, !current || current.enabled !== nextEnabled),
      previousAmountKobo: current ? current.amountKobo : null,
      newAmountKobo: amountKobo,
      previousEnabled: current ? current.enabled : null,
      newEnabled: nextEnabled,
      currency: saved.currency,
      resultingVersion: saved.version,
      adminId,
      adminEmail,
      requestId,
    });
  } catch (auditError) {
    // A price must never change without an audit entry: roll the change back.
    if (current) {
      await PlanPrice.findOneAndUpdate(
        { planId, version: saved.version },
        {
          $set: { amountKobo: current.amountKobo, enabled: current.enabled, updatedBy: current.updatedBy },
          $inc: { version: 1 },
        }
      );
    } else {
      await PlanPrice.deleteOne({ planId, version: saved.version });
    }
    throw new PricingError(500, 'AUDIT_FAILED', 'The price change could not be recorded and was not applied.');
  }

  return { changed: true, requestId, price: await loadAdminPrice(planId) };
}

// ---------------------------------------------------------------------------
// One-time, non-destructive initialisation
// ---------------------------------------------------------------------------
/**
 * The amounts currently approved by the business. They are used ONLY to create a
 * missing record ($setOnInsert) so an existing deployment keeps charging exactly
 * what it charges today. They are never read on the payment or display path.
 */
const APPROVED_INITIAL_PRICES_KOBO: Record<PaidPlanId, number> = {
  PRO_MONTHLY: 350_000,
  PRO_BIMONTHLY: 650_000,
  PRO_QUARTERLY: 1_000_000,
  PRO_ANNUAL: 2_500_000,
};

export async function seedApprovedPlanPricesIfMissing(): Promise<PaidPlanId[]> {
  const created: PaidPlanId[] = [];

  for (const planId of PAID_PLAN_IDS) {
    const result = await PlanPrice.updateOne(
      { planId },
      {
        $setOnInsert: {
          planId,
          amountKobo: APPROVED_INITIAL_PRICES_KOBO[planId],
          currency: 'NGN',
          enabled: true,
          version: 1,
          description: `${PAID_PLAN_CATALOG[planId].name} price`,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created.push(planId);
      await PriceChangeAudit.create({
        planId,
        changeType: 'INITIAL_SEED',
        previousAmountKobo: null,
        newAmountKobo: APPROVED_INITIAL_PRICES_KOBO[planId],
        previousEnabled: null,
        newEnabled: true,
        currency: 'NGN',
        resultingVersion: 1,
        adminEmail: 'system@initial-seed',
        requestId: `seed-${planId}`,
      });
    }
  }

  return created;
}
