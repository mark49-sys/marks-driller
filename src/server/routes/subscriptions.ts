import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { authenticateToken, requireVerified, AuthenticatedRequest } from '../middleware/auth.js';
import { sendSubscriptionEmail } from '../services/emailService.js';
import { PaystackService } from '../services/paystackService.js';
import { receiptUpload, validateReceiptFileSignature, RECEIPTS_DIR_ABSOLUTE } from '../middleware/upload.js';
import { CloudinaryService } from '../services/cloudinaryService.js';
import { env } from '../config/env.js';
import { FreeTrialService } from '../services/freeTrialService.js';
import {
  PAID_PLAN_IDS,
  PricingError,
  getChargeablePlanPrice,
  getPlanName,
  listPublicPlans,
  parseNairaToKobo,
} from '../services/pricingService.js';
import {
  checkChargeAgainstPayment,
  flagPaymentForReconciliation,
  fulfilGatewayPayment,
} from '../services/paymentFulfilmentService.js';

const router = Router();

function respondWithPricingError(error: unknown, res: Response): boolean {
  if (error instanceof PricingError) {
    res.status(error.status).json({ success: false, error: { message: error.message, code: error.code } });
    return true;
  }
  return false;
}

// GET /api/subscriptions/plans — Public subscription tiers (prices come from the database)
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await listPublicPlans();
    // Prices are admin-editable: never let browsers or proxies keep a stale copy.
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

export interface DynamicBankDetails {
  isConfigured: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  instructions: string;
}

export async function getDynamicBankDetails(): Promise<DynamicBankDetails> {
  try {
    const setting = await SystemSetting.findOne({ key: 'OFFICIAL_BANK_DETAILS' }).lean();
    if (setting && setting.value && typeof setting.value === 'object') {
      const val = setting.value as any;
      const bankName = String(val.bankName || '').trim();
      const accountName = String(val.accountName || '').trim();
      const accountNumber = String(val.accountNumber || '').trim();
      const currency = String(val.currency || 'NGN').trim();
      const instructions = String(val.instructions || '').trim();

      const isConfigured = Boolean(bankName && accountNumber);
      return {
        isConfigured,
        bankName,
        accountName,
        accountNumber,
        currency,
        instructions: instructions || 'Use your registered MarkDriller email address as the payment narration or transfer remark.',
      };
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch dynamic bank details from DB:', error);
  }

  return {
    isConfigured: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: 'NGN',
    instructions: 'Official receiving bank account details are currently being updated by platform administration.',
  };
}

// GET /api/subscriptions/bank-details — Official account details for direct bank transfer (Public endpoint, dynamic from database)
router.get('/bank-details', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const details = await getDynamicBankDetails();
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/receipts/:filename — Stream / render uploaded candidate receipt image or PDF
router.get('/receipts/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawFilename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
    const filename = path.basename(String(rawFilename || ''));
    const filePath = path.join(RECEIPTS_DIR_ABSOLUTE, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { message: 'Receipt not found.' } });
      return;
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
});


// ----------------------------------------------------
// PAYSTACK WEBHOOK (Unauthenticated, verified via HMAC SHA-512)
// ----------------------------------------------------
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
      res.status(401).json({ success: false, error: { message: 'Missing webhook signature.' } });
      return;
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Cryptographically verify signature
    const isValidSignature = PaystackService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      res.status(401).json({ success: false, error: { message: 'Invalid webhook signature.' } });
      return;
    }

    const event = req.body;

    if (event && event.event === 'charge.success' && event.data && typeof event.data.reference === 'string') {
      const { reference } = event.data;

      const payment = await Payment.findOne({ reference });
      if (!payment || payment.provider !== 'PAYSTACK') {
        // Unknown transaction reference
        res.status(200).json({ status: 'ignored', message: 'Payment record not found locally.' });
        return;
      }

      // Idempotency check: if already processed, return 200 without duplicate side effects
      if (payment.status === 'SUCCESS') {
        res.status(200).json({ status: 'success', message: 'Payment already processed.' });
        return;
      }

      const check = checkChargeAgainstPayment(payment, {
        status: String(event.data.status ?? ''),
        reference: String(reference),
        amountKobo: Number(event.data.amount),
        currency: String(event.data.currency ?? ''),
      });

      if (!check.ok) {
        // Signed event, but it does not match what we asked the customer to pay.
        console.warn(`[Payments] Webhook reconciliation issue for ${reference}: ${check.reason}`);
        await flagPaymentForReconciliation(payment._id, check.reason);
        res.status(200).json({ status: 'ignored', message: 'Charge did not match the initialized payment.' });
        return;
      }

      const result = await fulfilGatewayPayment(payment, {
        paidAt: event.data.paid_at ? new Date(event.data.paid_at) : new Date(),
        channel: event.data.channel,
      });

      // Send confirmation email asynchronously (only for the delivery that actually fulfilled it)
      if (!result.alreadyProcessed) {
        const user = await User.findById(payment.userId);
        if (user) {
          sendSubscriptionEmail(
            user.email,
            user.fullName,
            getPlanName(String(payment.metadata?.plan)),
            payment.amountKobo / 100,
            reference
          );
        }
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    res.status(500).json({ status: 'error' });
  }
});

// ----------------------------------------------------
// AUTHENTICATED SUBSCRIPTION ENDPOINTS
// ----------------------------------------------------
router.use(authenticateToken, requireVerified);

// GET /api/subscriptions/my-subscription — Active subscription details
router.get('/my-subscription', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const sub = await Subscription.findOne({
      userId,
      status: 'ACTIVE',
    }).sort({ createdAt: -1 });

    if (!sub) {
      const [trialUsage, freeTrial] = await Promise.all([
        FreeTrialService.getUsage(userId),
        FreeTrialService.getTrialStatus(userId, false),
      ]);
      res.status(200).json({
        success: true,
        data: {
          plan: 'FREE',
          status: 'ACTIVE',
          startDate: req.user!.createdAt,
          endDate: null,
          isPro: false,
          trialUsage: {
            isPro: false,
            ...trialUsage,
          },
          freeTrial,
        },
      });
      return;
    }

    // Check if subscription has expired
    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = 'EXPIRED';
      await sub.save();
      const [trialUsage, freeTrial] = await Promise.all([
        FreeTrialService.getUsage(userId),
        FreeTrialService.getTrialStatus(userId, false),
      ]);
      res.status(200).json({
        success: true,
        data: {
          plan: 'FREE',
          status: 'EXPIRED',
          isPro: false,
          trialUsage: {
            isPro: false,
            ...trialUsage,
          },
          freeTrial,
        },
      });
      return;
    }

    const isPro = sub.plan !== 'FREE';
    const [trialUsage, freeTrial] = await Promise.all([
      isPro
        ? Promise.resolve({ isPro: true, used: 0, limit: 200, remaining: 200, isLimitReached: false })
        : FreeTrialService.getUsage(userId).then((u) => ({ isPro: false, ...u })),
      FreeTrialService.getTrialStatus(userId, isPro),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...sub.toJSON(),
        isPro,
        trialUsage,
        freeTrial,
      },
    });
  } catch (error) {
    next(error);
  }
});


const initializeSchema = z
  .object({
    plan: z.enum(PAID_PLAN_IDS),
  })
  // Reject any extra key (e.g. amount, price, amountKobo): the browser never influences what is charged.
  .strict();

// POST /api/subscriptions/initialize — Generate Paystack transaction reference
router.post('/initialize', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan } = initializeSchema.parse(req.body);
    const userId = req.user!._id;
    const userEmail = req.user!.email;

    // Authoritative price lookup (database). Throws rather than falling back to a default.
    const price = await getChargeablePlanPrice(plan);
    const planName = getPlanName(plan);

    // Generate unique collision-resistant transaction reference
    const reference = `MD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Initialize with Paystack API (amount is in the currency subunit: kobo)
    const paystackInit = await PaystackService.initializeTransaction({
      email: userEmail,
      amountKobo: price.amountKobo,
      currency: price.currency,
      reference,
      plan,
      metadata: {
        userId: userId.toString(),
        userEmail,
        planName,
      },
    });

    // Create Payment record in PENDING status. The amount and currency are LOCKED here:
    // later admin price changes never alter an already-initialized transaction.
    const payment = await Payment.create({
      userId,
      reference,
      amountKobo: price.amountKobo,
      currency: price.currency,
      provider: 'PAYSTACK',
      status: 'PENDING',
      metadata: {
        plan,
        userEmail,
        planName,
        priceVersion: price.version,
        priceLockedAt: new Date(),
        accessCode: paystackInit.accessCode,
        authorizationUrl: paystackInit.authorizationUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        reference: payment.reference,
        amountKobo: payment.amountKobo,
        currency: payment.currency,
        plan,
        userEmail,
        publicKey: env.PAYSTACK_PUBLIC_KEY,
        authorizationUrl: paystackInit.authorizationUrl,
        accessCode: paystackInit.accessCode,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: error.flatten().fieldErrors },
      });
      return;
    }
    if (respondWithPricingError(error, res)) return;
    next(error);
  }
});

const verifySchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(100),
});

// POST /api/subscriptions/verify — Verify Paystack reference and activate student tier
router.post('/verify', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reference } = verifySchema.parse(req.body);
    const userId = req.user!._id;

    const payment = await Payment.findOne({ reference, userId });
    if (!payment) {
      res.status(404).json({ success: false, error: { message: 'Transaction reference not found.' } });
      return;
    }

    if (payment.provider !== 'PAYSTACK') {
      res.status(400).json({ success: false, error: { message: 'This reference is not an online card payment.' } });
      return;
    }

    // Idempotency: if already verified, return existing subscription immediately
    if (payment.status === 'SUCCESS') {
      const existingSub = await Subscription.findOne({ userId });
      res.status(200).json({
        success: true,
        message: 'Transaction was already verified successfully.',
        data: {
          ...(existingSub ? existingSub.toJSON() : {}),
          isPro: existingSub ? existingSub.plan !== 'FREE' : false,
        },
      });
      return;
    }

    if (payment.status !== 'PENDING') {
      res.status(409).json({ success: false, error: { message: 'This transaction can no longer be verified.' } });
      return;
    }

    // Server-side verification with official Paystack API. The browser's claim of success is never trusted.
    const verification = await PaystackService.verifyTransaction(reference, {
      amountKobo: payment.amountKobo,
      currency: payment.currency,
    });

    const check = checkChargeAgainstPayment(payment, {
      status: verification.success ? verification.status : 'failed',
      reference: verification.reference,
      amountKobo: verification.amountKobo,
      currency: verification.currency,
    });

    if (!check.ok) {
      const isGatewayNotSuccessful = check.reason === 'GATEWAY_STATUS_NOT_SUCCESS';
      if (!isGatewayNotSuccessful) {
        console.warn(`[Payments] Verification reconciliation issue for ${reference}: ${check.reason}`);
        await flagPaymentForReconciliation(payment._id, check.reason);
      }
      res.status(400).json({
        success: false,
        error: {
          message: isGatewayNotSuccessful
            ? 'Paystack transaction could not be confirmed as successful.'
            : 'Payment verification failed because the charge does not match the initialized payment.',
        },
      });
      return;
    }

    const result = await fulfilGatewayPayment(payment, {
      paidAt: verification.paidAt,
      channel: verification.channel,
    });
    const subscription = result.subscription ?? (await Subscription.findOne({ userId }));

    // Send confirmation email asynchronously (only when this call performed the fulfilment)
    if (!result.alreadyProcessed) {
      sendSubscriptionEmail(
        req.user!.email,
        req.user!.fullName,
        getPlanName(String(payment.metadata?.plan)),
        payment.amountKobo / 100,
        payment.reference
      );
    }

    res.status(200).json({
      success: true,
      message: 'Subscription successfully activated!',
      data: {
        plan: subscription?.plan,
        status: subscription?.status,
        startDate: subscription?.startDate,
        endDate: subscription?.endDate,
        reference: payment.reference,
        isPro: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.flatten().fieldErrors } });
      return;
    }
    next(error);
  }
});

const manualProofSchema = z.object({
  plan: z.enum(PAID_PLAN_IDS),
  depositorName: z.string().trim().min(2, 'Depositor name must be at least 2 characters'),
  bankName: z.string().trim().min(2, 'Bank name is required'),
  amountPaidNGN: z.number().positive('Amount paid must be greater than zero'),
  transferDate: z.string().optional(),
  proofUrl: z.string().min(5, 'Valid payment receipt or screenshot URL is required'),
  notes: z.string().max(500).optional(),
});

// POST /api/subscriptions/upload-receipt — Candidate receipt file upload (images & PDF)
router.post(
  '/upload-receipt',
  authenticateToken,
  requireVerified,
  (req, res, next) => {
    receiptUpload.single('receipt')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: { message: err.message || 'Receipt upload error.' } });
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'No receipt file uploaded.' } });
        return;
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;

      // Validate authentic image or PDF binary signature (magic bytes)
      const isValidSig = await validateReceiptFileSignature(filePath);
      if (!isValidSig) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(400).json({
          success: false,
          error: { message: 'Uploaded file content does not match an approved image screenshot or PDF document.' },
        });
        return;
      }

      const isCloudinary = env.STORAGE_PROVIDER === 'cloudinary' && CloudinaryService.isConfigured();

      if (isCloudinary) {
        try {
          const cloudRes = await CloudinaryService.uploadFile(filePath, originalName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(200).json({
            success: true,
            data: {
              fileUrl: cloudRes.secureUrl,
              filename: cloudRes.publicId,
              originalName,
            },
          });
          return;
        } catch (cloudErr) {
          console.warn('Cloudinary receipt upload failed, falling back to local storage:', cloudErr);
        }
      }

      const fileUrl = `/api/subscriptions/receipts/${path.basename(req.file.filename)}`;
      res.status(200).json({
        success: true,
        data: {
          fileUrl,
          filename: req.file.filename,
          originalName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/subscriptions/manual-proof — Submit proof of direct bank transfer for admin review
router.post(
  '/manual-proof',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = manualProofSchema.parse(req.body);
      const userId = req.user!._id;

      // Authoritative price snapshot at submission time (database, never the browser)
      const price = await getChargeablePlanPrice(data.plan);
      const planName = getPlanName(data.plan);

      const declaredAmountKobo = parseNairaToKobo(data.amountPaidNGN);
      if (declaredAmountKobo === null || declaredAmountKobo <= 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Please provide a valid amount paid in NGN (up to 2 decimal places).' },
        });
        return;
      }

      // Check for an existing pending review proof for this user
      const existingPending = await Payment.findOne({
        userId,
        provider: 'MANUAL_BANK_TRANSFER',
        status: 'PENDING_REVIEW',
      });

      if (existingPending) {
        res.status(409).json({
          success: false,
          error: {
            message:
              'You already have a manual payment proof currently pending review by our administrative team. Reference: ' +
              existingPending.reference,
          },
        });
        return;
      }

      const reference = `MNL_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const payment = await Payment.create({
        userId,
        reference,
        amountKobo: declaredAmountKobo,
        currency: 'NGN',
        provider: 'MANUAL_BANK_TRANSFER',
        status: 'PENDING_REVIEW',
        channel: 'direct_bank_transfer',
        depositorName: data.depositorName,
        bankName: data.bankName,
        proofUrl: data.proofUrl,
        transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
        metadata: {
          plan: data.plan,
          planName,
          expectedAmountKobo: price.amountKobo,
          priceVersion: price.version,
          notes: data.notes || '',
          userEmail: req.user!.email,
          userFullName: req.user!.fullName,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Your payment proof has been submitted successfully and is pending administrator verification.',
        data: {
          reference: payment.reference,
          status: payment.status,
          plan: data.plan,
          amountPaidNGN: data.amountPaidNGN,
          submittedAt: payment.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: error.flatten().fieldErrors },
        });
        return;
      }
      if (respondWithPricingError(error, res)) return;
      next(error);
    }
  }
);

// GET /api/subscriptions/my-payments — Return the logged-in student's complete payment history
router.get(
  '/my-payments',
  authenticateToken,
  requireVerified,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

