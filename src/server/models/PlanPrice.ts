import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const PAID_PLAN_IDS = ['PRO_MONTHLY', 'PRO_BIMONTHLY', 'PRO_QUARTERLY', 'PRO_ANNUAL'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const SUPPORTED_CURRENCIES = ['NGN'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Smallest chargeable amount: ₦50.00 (Paystack NGN minimum). */
export const MIN_PRICE_KOBO = 5_000;
/** Largest accepted amount: ₦10,000,000.00 — guards against fat-finger entries. */
export const MAX_PRICE_KOBO = 1_000_000_000;

export interface IPlanPrice extends Document {
  _id: Types.ObjectId;
  planId: PaidPlanId;
  /** Integer amount in the smallest currency unit (kobo). Never a float. */
  amountKobo: number;
  currency: SupportedCurrency;
  description: string;
  enabled: boolean;
  /** Monotonic counter used for optimistic concurrency and payment price-locking. */
  version: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanPriceSchema = new Schema<IPlanPrice>(
  {
    planId: {
      type: String,
      enum: PAID_PLAN_IDS,
      required: true,
      unique: true,
      index: true,
    },
    amountKobo: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) =>
          Number.isSafeInteger(v) && v >= MIN_PRICE_KOBO && v <= MAX_PRICE_KOBO,
        message: 'amountKobo must be a safe integer within the permitted price range.',
      },
    },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: 'NGN',
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const PlanPrice: Model<IPlanPrice> =
  mongoose.models.PlanPrice || mongoose.model<IPlanPrice>('PlanPrice', PlanPriceSchema);
