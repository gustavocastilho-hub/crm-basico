import api from './axios';

export const plansApi = {
  list: () => api.get('/plans'),
  create: (data: { name: string }) => api.post('/plans', data),
  remove: (id: string) => api.delete(`/plans/${id}`),
};
