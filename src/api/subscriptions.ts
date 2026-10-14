import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client.js';

export interface PlanTier {
  id: 'FREE' | 'PRO_MONTHLY' | 'PRO_BIMONTHLY' | 'PRO_QUARTERLY' | 'PRO_ANNUAL';
  name: string;
  /** null when the admin has not configured a valid price for this plan. */
  priceNGN: number | null;
  priceKobo: number | null;
  currency: string;
  billingPeriod: string;
  description: string;
  features: string[];
  isPopular: boolean;
  /** false when the plan is free, disabled, or has no valid price. */
  purchasable: boolean;
}

export const PLANS_QUERY_KEY = ['subscription', 'plans'] as const;

/** Formats an amount in kobo for display, e.g. 350000 -> "₦3,500". */
export function formatKoboAsNaira(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined) return '—';
  const naira = kobo / 100;
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: Number.isInteger(naira) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Converts integer kobo to a plain decimal string for an input field, e.g. 350000 -> "3500", 350050 -> "3500.50". */
export function koboToNairaInput(kobo: number): string {
  const whole = Math.floor(kobo / 100);
  const fraction = kobo % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

export interface UserSubscription {
  plan: 'FREE' | 'PRO_MONTHLY' | 'PRO_BIMONTHLY' | 'PRO_QUARTERLY' | 'PRO_ANNUAL';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate?: string | null;
  isPro: boolean;
  trialUsage?: {
    isPro: boolean;
    used: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  };
  freeTrial?: {
    isPro: boolean;
    allowed: number;
    used: number;
    remaining: number;
    isExhausted: boolean;
    permittedYear: number;
  };
}


export function useSubscriptionPlansQuery() {
  return useQuery<PlanTier[]>({
    queryKey: PLANS_QUERY_KEY,
    queryFn: () => apiClient<PlanTier[]>('/api/subscriptions/plans'),
    // Prices are admin-editable: keep the cache very short-lived and re-check whenever the user returns.
    staleTime: 15000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}

export function useMySubscriptionQuery() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;

  return useQuery<UserSubscription>({
    queryKey: ['subscription', 'my-subscription'],
    queryFn: () => apiClient<UserSubscription>('/api/subscriptions/my-subscription'),
    enabled: Boolean(token),
    staleTime: 60000,
    retry: false,
  });
}

export function useInitializePaymentMutation() {
  return useMutation({
    mutationFn: (plan: 'PRO_MONTHLY' | 'PRO_BIMONTHLY' | 'PRO_QUARTERLY' | 'PRO_ANNUAL') =>
      apiClient<{
        reference: string;
        amountKobo: number;
        currency: string;
        plan: string;
        userEmail: string;
        publicKey: string;
        authorizationUrl?: string;
        accessCode?: string;
      }>('/api/subscriptions/initialize', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) =>
      apiClient<{ verified: boolean; plan: string; subscription: any }>('/api/subscriptions/verify', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'my-subscription'] });
    },
  });
}

export interface BankDetails {
  isConfigured: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  instructions: string;
}

export function useBankDetailsQuery() {
  return useQuery<BankDetails>({
    queryKey: ['subscription', 'bank-details'],
    queryFn: () => apiClient<BankDetails>('/api/subscriptions/bank-details'),
    staleTime: 300000,
    retry: 1,
  });
}

export interface ManualProofPayload {
  plan: 'PRO_MONTHLY' | 'PRO_BIMONTHLY' | 'PRO_QUARTERLY' | 'PRO_ANNUAL';
  depositorName: string;
  bankName: string;
  amountPaidNGN: number;
  transferDate?: string;
  proofUrl: string;
  notes?: string;
}

export interface UploadReceiptResponse {
  fileUrl: string;
  filename: string;
  originalName: string;
}

export function useUploadReceiptMutation() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadReceiptResponse> => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await fetch('/api/subscriptions/upload-receipt', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to upload receipt proof.');
      }
      return json.data as UploadReceiptResponse;
    },
  });
}

export function useSubmitManualProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualProofPayload) =>
      apiClient<{
        reference: string;
        status: string;
        plan: string;
        amountPaidNGN: number;
        submittedAt: string;
      }>('/api/subscriptions/manual-proof', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export interface UserPaymentItem {
  _id: string;
  reference: string;
  amountKobo: number;
  currency: string;
  provider: 'PAYSTACK' | 'MANUAL_BANK_TRANSFER' | 'SCRATCH_CARD_PIN';
  status: 'PENDING' | 'PENDING_REVIEW' | 'SUCCESS' | 'FAILED' | 'REJECTED';
  channel?: string;
  depositorName?: string;
  bankName?: string;
  proofUrl?: string;
  transferDate?: string;
  paidAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export function useMyPaymentsQuery() {
  return useQuery<UserPaymentItem[]>({
    queryKey: ['subscription', 'my-payments'],
    queryFn: () => apiClient<UserPaymentItem[]>('/api/subscriptions/my-payments'),
    staleTime: 30000,
  });
}


