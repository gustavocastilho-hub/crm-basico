import api from './axios';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  salesByMonth: () => api.get('/dashboard/sales-by-month'),
  conversionFunnel: () => api.get('/dashboard/conversion-funnel'),
  leadsBySource: (startDate: string, endDate: string) =>
    api.get('/dashboard/leads-by-source', { params: { startDate, endDate } }),
  recentActivities: () => api.get('/dashboard/recent-activities'),
};
