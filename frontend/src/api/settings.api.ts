import api from './axios';

export interface CommissionsConfig {
  plans: { planId: string; planName: string; fee: number }[];
  percentages: { SDR: number; NON_SDR: number };
  defaultSdrUserId: string | null;
}

export const settingsApi = {
  getCommissions: () => api.get<CommissionsConfig>('/settings/commissions'),
  updateCommissions: (data: {
    plans?: { planId: string; fee: number }[];
    percentages?: { SDR?: number; NON_SDR?: number };
    defaultSdrUserId?: string | null;
  }) => api.put<CommissionsConfig>('/settings/commissions', data),
};
