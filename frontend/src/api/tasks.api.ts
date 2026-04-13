import api from './axios';

export const tasksApi = {
  list: (params?: { page?: number; limit?: number; status?: string; clientId?: string }) =>
    api.get('/tasks', { params }),

  upcoming: () => api.get('/tasks/upcoming'),

  get: (id: string) => api.get(`/tasks/${id}`),

  create: (data: { title: string; description?: string; dueDate?: string; clientId?: string; status?: string }) =>
    api.post('/tasks', data),

  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),

  remove: (id: string) => api.delete(`/tasks/${id}`),
};
