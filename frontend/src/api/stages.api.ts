import api from './axios';

export const stagesApi = {
  list: () => api.get('/stages'),

  create: (data: { label: string; color: string; type?: 'OPEN' | 'WON' | 'LOST' }) =>
    api.post('/stages', data),

  update: (id: string, data: { label?: string; color?: string; type?: 'OPEN' | 'WON' | 'LOST' }) =>
    api.patch(`/stages/${id}`, data),

  remove: (id: string) => api.delete(`/stages/${id}`),

  reorder: (ids: string[]) => api.patch('/stages/reorder', { ids }),
};
