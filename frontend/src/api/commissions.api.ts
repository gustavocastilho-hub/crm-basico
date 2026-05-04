import api from './axios';

export interface Commission {
  id: string;
  dealId: string;
  userId: string;
  percentage: string;
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
  };
  user: { id: string; name: string };
}

export interface EligibleDeal {
  id: string;
  title: string;
  value: string | null;
  closedAt: string | null;
  client: { id: string; name: string };
  owner: { id: string; name: string };
  stage: { id: string; label: string };
}

export const commissionsApi = {
  list: (startDate?: string, endDate?: string) =>
    api.get<Commission[]>('/commissions', { params: { startDate, endDate } }),
  eligibleDeals: () => api.get<EligibleDeal[]>('/commissions/eligible-deals'),
  create: (data: { dealId: string; userId: string; percentage: number; notes?: string | null }) =>
    api.post<Commission>('/commissions', data),
  update: (id: string, data: { percentage?: number; notes?: string | null }) =>
    api.patch<Commission>(`/commissions/${id}`, data),
  remove: (id: string) => api.delete(`/commissions/${id}`),
};
