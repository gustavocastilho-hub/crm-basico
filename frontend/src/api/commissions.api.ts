import api from './axios';

export type CommissionType = 'SDR' | 'NON_SDR' | 'OTHER';
export type CommissionStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface CommissionPayment {
  id: string;
  commissionId: string;
  amount: string;
  paidAt: string;
  receiptUrl: string | null;
  receiptName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentBatchSummary {
  batchId: string;
  paidAt: string;
  totalAmount: number;
  paymentsCount: number;
  receiptUrl: string | null;
  receiptName: string | null;
  notes: string | null;
  referenceMonth: string;
  deals: { id: string; title: string; clientName: string }[];
}

export interface PaymentBatchDetailItem {
  paymentId: string;
  amount: number;
  paidAt: string;
  commission: Commission;
}

export interface PaymentBatchDetail {
  batchId: string;
  paidAt: string;
  totalAmount: number;
  receiptUrl: string | null;
  receiptName: string | null;
  notes: string | null;
  referenceMonth: string;
  items: PaymentBatchDetailItem[];
}

export interface Commission {
  id: string;
  dealId: string;
  userId: string;
  referenceMonth: string;
  type: CommissionType;
  implementationFee: string;
  percentage: string;
  calculatedAmount: string;
  paidAmount: string | null;
  status: CommissionStatus;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deal: {
    id: string;
    title: string;
    value: string | null;
    closedAt: string | null;
    client: { id: string; name: string };
    stage: { id: string; label: string; type: 'OPEN' | 'WON' | 'LOST' };
    origin: { id: string; name: string } | null;
    plan: { id: string; name: string } | null;
  };
  user: { id: string; name: string };
  payments?: CommissionPayment[];
}

export interface EligibleDeal {
  id: string;
  title: string;
  value: string | null;
  closedAt: string | null;
  contractExitedAt: string | null;
  contractSignedAt: string | null;
  client: { id: string; name: string };
  owner: { id: string; name: string };
  stage: { id: string; label: string; position: number };
  origin: { id: string; name: string } | null;
  plan: { id: string; name: string } | null;
}

export interface BatchItem {
  dealId: string;
  type: CommissionType;
  implementationFee: number;
  percentage: number;
}

export interface EstimateItem {
  status: 'ESTIMATED' | 'REGISTERED';
  commissionId?: string;
  deal: { id: string; title: string; client: { id: string; name: string } };
  plan: { id: string; name: string } | null;
  origin: { id: string; name: string } | null;
  type: CommissionType;
  implementationFee: number;
  percentage: number;
  calculatedAmount: number;
  contractSignedAt: string | null;
}

export interface EstimateResponse {
  items: EstimateItem[];
  total: number;
}

export const commissionsApi = {
  list: (params: { startDate?: string; endDate?: string; referenceMonth?: string; status?: CommissionStatus } = {}) =>
    api.get<Commission[]>('/commissions', { params }),
  eligibleDeals: (referenceMonth: string) =>
    api.get<EligibleDeal[]>('/commissions/eligible-deals', { params: { referenceMonth } }),
  estimate: (referenceMonth: string) =>
    api.get<EstimateResponse>('/commissions/estimate', { params: { referenceMonth } }),
  createBatch: (data: { referenceMonth: string; notes?: string | null; items: BatchItem[] }) =>
    api.post<Commission[]>('/commissions/batch', data),
  update: (
    id: string,
    data: {
      type?: CommissionType;
      implementationFee?: number;
      percentage?: number;
      paidAmount?: number | null;
      notes?: string | null;
    },
  ) => api.patch<Commission>(`/commissions/${id}`, data),
  pay: (id: string, paidAt: string, paidAmount?: number | null) =>
    api.patch<Commission>(`/commissions/${id}/pay`, { paidAt, paidAmount }),
  unpay: (id: string) => api.patch<Commission>(`/commissions/${id}/unpay`),
  remove: (id: string) => api.delete(`/commissions/${id}`),
  listPayments: (id: string) =>
    api.get<CommissionPayment[]>(`/commissions/${id}/payments`),
  listPaymentBatches: (referenceMonth?: string) =>
    api.get<PaymentBatchSummary[]>('/commissions/payment-batches', {
      params: referenceMonth ? { referenceMonth } : {},
    }),
  getPaymentBatch: (batchId: string) =>
    api.get<PaymentBatchDetail>(`/commissions/payment-batches/${batchId}`),
  addPayment: (id: string, formData: FormData) =>
    api.post<Commission>(`/commissions/${id}/payments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePayment: (id: string, paymentId: string) =>
    api.delete<Commission>(`/commissions/${id}/payments/${paymentId}`),
};
