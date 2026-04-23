import api from './axios';

export type ContractStage =
  | 'NOT_GENERATED'
  | 'LINK_SENT'
  | 'FORM_FILLED'
  | 'MINUTA_SENT'
  | 'SIGNING_SENT'
  | 'SIGNED';

export const dealsApi = {
  list: () => api.get('/deals'),

  get: (id: string) => api.get(`/deals/${id}`),

  create: (data: {
    title: string;
    value?: number;
    clientId: string;
    stageId: string;
    originId?: string | null;
    nicheId?: string | null;
    planId?: string | null;
    notes?: string | null;
  }) => api.post('/deals', data),

  update: (id: string, data: any) => api.patch(`/deals/${id}`, data),

  move: (id: string, data: { stageId: string; position: number }) =>
    api.patch(`/deals/${id}/stage`, data),

  updateContractStage: (id: string, stage: ContractStage) =>
    api.patch(`/deals/${id}/contract-stage`, { stage }),

  remove: (id: string) => api.delete(`/deals/${id}`),

  bulkRemove: (ids: string[]) => api.post('/deals/bulk-delete', { ids }),
};
