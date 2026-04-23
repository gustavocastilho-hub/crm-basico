import api from './axios';

export const nichesApi = {
  list: () => api.get('/niches'),
  create: (data: { name: string }) => api.post('/niches', data),
  remove: (id: string) => api.delete(`/niches/${id}`),
};
