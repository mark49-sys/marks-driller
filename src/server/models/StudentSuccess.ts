import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type ConsentStatus = 'obtained' | 'pending' | 'withdrawn';

export interface IStudentSuccess extends Document {
  _id: Types.ObjectId;
  studentDisplayName: string;
  photoUrl: string;
  examType: string;
  examYear: number;
  score: string;
  scoreBreakdown?: string;
  caption?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationEvidence?: string;
  consentStatus: ConsentStatus;
  consentRecordRef?: string;
  guardianConsent: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSuccessSchema = new Schema<IStudentSuccess>(
  {
    studentDisplayName: {
      type: String,
      required: [true, 'Student display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    photoUrl: {
      type: String,
      required: [true, 'Authorised photograph URL is required'],
      trim: true,
    },
    examType: {
      type: String,
      required: [true, 'Examination type is required (e.g. JAMB / UTME, WAEC, NECO)'],
      trim: true,
      index: true,
    },
    examYear: {
      type: Number,
      required: [true, 'Examination year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2030, 'Year cannot exceed 2030'],
      default: 2024,
    },
    score: {
      type: String,
      required: [true, 'Verified score or grades required'],
      trim: true,
    },
    scoreBreakdown: {
      type: String,
      default: '',
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    verifiedBy: {
      type: String,
      default: '',
      trim: true,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    verificationEvidence: {
      type: String,
      default: '',
      trim: true,
    },
    consentStatus: {
      type: String,
      enum: ['obtained', 'pending', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    consentRecordRef: {
      type: String,
      default: '',
      trim: true,
    },
    guardianConsent: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high-speed public query: verified, consent obtained, published, ordered
StudentSuccessSchema.index({
  isPublished: 1,
  verificationStatus: 1,
  consentStatus: 1,
  displayOrder: 1,
  createdAt: -1,
});

export const StudentSuccess: Model<IStudentSuccess> =
  mongoose.models.StudentSuccess ||
  mongoose.model<IStudentSuccess>('StudentSuccess', StudentSuccessSchema);

export default StudentSuccess;
