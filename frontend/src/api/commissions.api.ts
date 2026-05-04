import api from './axios';

export type CommissionType = 'SDR' | 'NON_SDR' | 'OTHER';
export type CommissionStatus = 'UNPAID' | 'PAID';

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
}

export interface EligibleDeal {
  id: string;
  title: string;
  value: string | null;
  closedAt: string | null;
  contractExitedAt: string | null;
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
  contractExitedAt: string | null;
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
};
