import { useCallback, useEffect, useMemo, useState } from 'react';
import { deletionRequestsApi, DeletionRequest, DeletionRequestStatus } from '../api/deletionRequests.api';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const STATUS_LABEL: Record<DeletionRequestStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
};

const STATUS_BADGE: Record<DeletionRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const ENTITY_LABEL = { CLIENT: 'Cliente', DEAL: 'Negócio' } as const;

export function DeletionRequestsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<DeletionRequest[]>([]);
  const [tab, setTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<DeletionRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [cancelTarget, setCancelTarget] = useState<DeletionRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await deletionRequestsApi.list();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao carregar solicitações');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (tab === 'PENDING') return items.filter((i) => i.status === 'PENDING');
    return items.filter((i) => i.status !== 'PENDING');
  }, [items, tab]);

  const handleApprove = async (req: DeletionRequest) => {
    if (!confirm(`Confirmar exclusão de "${req.entityLabel}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deletionRequestsApi.approve(req.id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao aprovar');
    }
  };

  const openReject = (req: DeletionRequest) => {
    setRejectTarget(req);
    setRejectNotes('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await deletionRequestsApi.reject(rejectTarget.id, rejectNotes.trim() || null);
      setRejectTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao recusar');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await deletionRequestsApi.cancel(cancelTarget.id);
      setCancelTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao cancelar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Solicitações de exclusão</h1>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('PENDING')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'PENDING'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setTab('HISTORY')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'HISTORY'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-8 text-center text-gray-500 text-sm">
          Nenhuma solicitação {tab === 'PENDING' ? 'pendente' : 'no histórico'}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Criada em</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-sm text-gray-700">{ENTITY_LABEL[req.entityType]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{req.entityLabel}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                    <div className="whitespace-pre-wrap break-words">{req.reason || '-'}</div>
                    {req.reviewNotes && (
                      <div className="mt-1 text-xs text-red-700">
                        <strong>Resposta:</strong> {req.reviewNotes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{req.requestedBy.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(req.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                    {req.reviewedBy && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        por {req.reviewedBy.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                    {req.status === 'PENDING' && isAdmin && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => openReject(req)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {req.status === 'PENDING' && !isAdmin && req.requestedById === user?.id && (
                      <button
                        onClick={() => setCancelTarget(req)}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Recusar solicitação">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Recusando a exclusão de <strong>{rejectTarget?.entityLabel}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (opcional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Explique ao solicitante o motivo da recusa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRejectTarget(null)}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Recusar solicitação
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar solicitação"
        message={`Cancelar a solicitação de exclusão de "${cancelTarget?.entityLabel}"?`}
      />
    </div>
  );
}
