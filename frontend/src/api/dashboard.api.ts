import api from './axios';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  salesByMonth: () => api.get('/dashboard/sales-by-month'),
  conversionFunnel: () => api.get('/dashboard/conversion-funnel'),
  recentActivities: () => api.get('/dashboard/recent-activities'),
};
