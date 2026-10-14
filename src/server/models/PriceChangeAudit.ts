import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PriceChangeType = 'INITIAL_SEED' | 'PRICE' | 'ENABLED' | 'PRICE_AND_ENABLED';

export interface IPriceChangeAudit extends Document {
  _id: Types.ObjectId;
  planId: string;
  changeType: PriceChangeType;
  previousAmountKobo: number | null;
  newAmountKobo: number;
  previousEnabled: boolean | null;
  newEnabled: boolean;
  currency: string;
  resultingVersion: number;
  adminId?: Types.ObjectId;
  adminEmail?: string;
  requestId: string;
  createdAt: Date;
}

const PriceChangeAuditSchema = new Schema<IPriceChangeAudit>(
  {
    planId: { type: String, required: true, index: true },
    changeType: {
      type: String,
      enum: ['INITIAL_SEED', 'PRICE', 'ENABLED', 'PRICE_AND_ENABLED'],
      required: true,
    },
    previousAmountKobo: { type: Number, default: null },
    newAmountKobo: { type: Number, required: true },
    previousEnabled: { type: Boolean, default: null },
    newEnabled: { type: Boolean, required: true },
    currency: { type: String, required: true },
    resultingVersion: { type: Number, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminEmail: { type: String, trim: true, lowercase: true },
    requestId: { type: String, required: true, index: true },
  },
  {
    // Append-only: no updatedAt, entries are never rewritten.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PriceChangeAuditSchema.index({ createdAt: -1 });

const IMMUTABLE_MESSAGE = 'Price audit entries are append-only and cannot be modified or deleted.';

// Application-level immutability: block every update/delete path Mongoose exposes.
const blockedQueryOps = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
] as const;

for (const op of blockedQueryOps) {
  (PriceChangeAuditSchema as any).pre(op, function () {
    throw new Error(IMMUTABLE_MESSAGE);
  });
}

PriceChangeAuditSchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error(IMMUTABLE_MESSAGE);
  }
});

(PriceChangeAuditSchema as any).pre('deleteOne', { document: true, query: false }, function () {
  throw new Error(IMMUTABLE_MESSAGE);
});

export const PriceChangeAudit: Model<IPriceChangeAudit> =
  mongoose.models.PriceChangeAudit ||
  mongoose.model<IPriceChangeAudit>('PriceChangeAudit', PriceChangeAuditSchema);
