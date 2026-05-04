import api from './axios';

export interface SdrContact {
  id: string;
  contactDate: string;
  contactTime: string;
  name: string;
  company: string | null;
  whatsapp: string | null;
  summary: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface SdrContactInput {
  contactDate: string;
  contactTime: string;
  name: string;
  company?: string | null;
  whatsapp?: string | null;
  summary: string;
}

export const sdrApi = {
  list: (startDate?: string, endDate?: string) =>
    api.get<SdrContact[]>('/sdr-contacts', { params: { startDate, endDate } }),
  create: (data: SdrContactInput) => api.post<SdrContact>('/sdr-contacts', data),
  update: (id: string, data: Partial<SdrContactInput>) =>
    api.patch<SdrContact>(`/sdr-contacts/${id}`, data),
  remove: (id: string) => api.delete(`/sdr-contacts/${id}`),
};
