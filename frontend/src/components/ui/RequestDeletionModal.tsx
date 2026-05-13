import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { deletionRequestsApi, DeletionEntityType } from '../../api/deletionRequests.api';

interface Props {
  open: boolean;
  onClose: () => void;
  entityType: DeletionEntityType;
  entityId: string | null;
  entityLabel: string;
  onSuccess?: () => void;
}

export function RequestDeletionModal({
  open,
  onClose,
  entityType,
  entityId,
  entityLabel,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      await deletionRequestsApi.create({
        entityType,
        entityId,
        reason: reason.trim() || null,
      });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Erro ao enviar solicitação');
    }
    setLoading(false);
  };

  const entityLabelLower = entityType === 'CLIENT' ? 'cliente' : 'negócio';

  return (
    <Modal open={open} onClose={onClose} title={`Solicitar exclusão de ${entityLabelLower}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Você está solicitando a exclusão de <strong>{entityLabel}</strong>. Um administrador
          irá analisar o pedido e poderá aprovar ou recusar.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Por que este registro deve ser excluído?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
