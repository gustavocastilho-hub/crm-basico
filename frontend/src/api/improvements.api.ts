import api from './axios';

export interface ImprovementRequest {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  implemented: boolean;
  implementedAt: string | null;
  implementedById: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
  implementedBy: { id: string; name: string } | null;
}

export const improvementsApi = {
  list: () => api.get<ImprovementRequest[]>('/improvements'),
  create: (data: { title: string; description?: string | null }) =>
    api.post<ImprovementRequest>('/improvements', data),
  update: (id: string, data: { title?: string; description?: string | null }) =>
    api.patch<ImprovementRequest>(`/improvements/${id}`, data),
  setImplemented: (id: string, implemented: boolean) =>
    api.patch<ImprovementRequest>(`/improvements/${id}/implemented`, { implemented }),
  remove: (id: string) => api.delete(`/improvements/${id}`),
  bulk: (ids: string[], action: 'delete' | 'mark_implemented' | 'mark_pending') =>
    api.post<{ affected: number }>('/improvements/bulk', { ids, action }),
};
