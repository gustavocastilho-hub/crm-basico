import api from './axios';

export type DeletionEntityType = 'CLIENT' | 'DEAL';
export type DeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DeletionRequest {
  id: string;
  entityType: DeletionEntityType;
  entityId: string;
  entityLabel: string;
  reason: string | null;
  status: DeletionRequestStatus;
  requestedById: string;
  reviewedById: string | null;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  requestedBy: { id: string; name: string };
  reviewedBy: { id: string; name: string } | null;
}

export const deletionRequestsApi = {
  list: (status?: DeletionRequestStatus) =>
    api.get<DeletionRequest[]>('/deletion-requests', {
      params: status ? { status } : undefined,
    }),
  pendingCount: () => api.get<{ count: number }>('/deletion-requests/pending-count'),
  create: (data: { entityType: DeletionEntityType; entityId: string; reason?: string | null }) =>
    api.post<DeletionRequest>('/deletion-requests', data),
  approve: (id: string) => api.patch<DeletionRequest>(`/deletion-requests/${id}/approve`),
  reject: (id: string, reviewNotes?: string | null) =>
    api.patch<DeletionRequest>(`/deletion-requests/${id}/reject`, { reviewNotes: reviewNotes ?? null }),
  cancel: (id: string) => api.delete(`/deletion-requests/${id}`),
};
