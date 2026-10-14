import { Types } from 'mongoose';
import { Payment, type IPayment } from '../models/Payment.js';
import { Subscription, type PlanType } from '../models/Subscription.js';
import { getPlanDurationDays, isPaidPlanId, type PaidPlanId } from './pricingService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Creates or renews the single subscription document for a user.
 * Atomic upsert so concurrent fulfilments cannot create duplicates.
 */
export async function activateSubscription(userId: Types.ObjectId, plan: PaidPlanId) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + getPlanDurationDays(plan) * DAY_MS);

  return Subscription.findOneAndUpdate(
    { userId },
    {
      $set: { plan: plan as PlanType, status: 'ACTIVE', startDate, endDate },
      $setOnInsert: { autoRenew: false },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export interface GatewayChargeFacts {
  status: string;
  reference: string;
  amountKobo: number;
  currency: string;
}

export type ChargeCheck = { ok: true } | { ok: false; reason: string };

/**
 * Compares what the gateway says was charged against the amount/currency/reference
 * that was LOCKED on the Payment record when it was initialised.
 * Strict equality: a zero or missing amount is never treated as "unknown, so accept".
 */
export function checkChargeAgainstPayment(payment: IPayment, facts: GatewayChargeFacts): ChargeCheck {
  if (facts.status !== 'success') return { ok: false, reason: 'GATEWAY_STATUS_NOT_SUCCESS' };
  if (facts.reference !== payment.reference) return { ok: false, reason: 'REFERENCE_MISMATCH' };
  if (!Number.isSafeInteger(facts.amountKobo) || facts.amountKobo !== payment.amountKobo) {
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  }
  if (String(facts.currency || '').toUpperCase() !== String(payment.currency || '').toUpperCase()) {
    return { ok: false, reason: 'CURRENCY_MISMATCH' };
  }
  const plan = payment.metadata?.plan;
  if (!isPaidPlanId(plan)) return { ok: false, reason: 'PLAN_INVALID' };
  return { ok: true };
}

/** Records why a payment could not be reconciled, without changing its status. */
export async function flagPaymentForReconciliation(paymentId: Types.ObjectId, reason: string) {
  await Payment.updateOne(
    { _id: paymentId, status: 'PENDING' },
    { $set: { 'metadata.reconciliation': { issue: reason, flaggedAt: new Date() } } }
  );
}

export interface FulfilmentResult {
  alreadyProcessed: boolean;
  payment: IPayment;
  subscription: Awaited<ReturnType<typeof activateSubscription>> | null;
}

/**
 * Idempotent, race-safe fulfilment for a gateway-confirmed payment.
 * Only one caller (webhook or verify) can move PENDING -> SUCCESS; the loser
 * observes the finished state. If activation fails the claim is released so the
 * next webhook retry / verify call can complete it.
 */
export async function fulfilGatewayPayment(
  payment: IPayment,
  details: { paidAt?: Date; channel?: string }
): Promise<FulfilmentResult> {
  const plan = payment.metadata?.plan;
  if (!isPaidPlanId(plan)) {
    throw new Error('Payment has no valid plan metadata.');
  }

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'PENDING' },
    { $set: { status: 'SUCCESS', paidAt: details.paidAt ?? new Date(), channel: details.channel || 'card' } },
    { new: true }
  );

  if (!claimed) {
    const latest = (await Payment.findById(payment._id)) ?? payment;
    return { alreadyProcessed: true, payment: latest, subscription: null };
  }

  try {
    const subscription = await activateSubscription(claimed.userId, plan);
    claimed.subscriptionId = subscription._id;
    await claimed.save();
    return { alreadyProcessed: false, payment: claimed, subscription };
  } catch (error) {
    await Payment.updateOne({ _id: claimed._id, status: 'SUCCESS', subscriptionId: null }, { $set: { status: 'PENDING' } });
    throw error;
  }
}
