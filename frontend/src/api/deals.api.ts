import api from './axios';

export const dealsApi = {
  list: () => api.get('/deals'),

  get: (id: string) => api.get(`/deals/${id}`),

  create: (data: { title: string; value?: number; clientId: string; stage?: string }) =>
    api.post('/deals', data),

  update: (id: string, data: any) => api.patch(`/deals/${id}`, data),

  move: (id: string, data: { stage: string; position: number }) =>
    api.patch(`/deals/${id}/stage`, data),

  remove: (id: string) => api.delete(`/deals/${id}`),
};
