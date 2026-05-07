import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { dealsApi } from '../../api/deals.api';

interface Props {
  open: boolean;
  dealId: string | null;
  dealTitle?: string;
  initialDate?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContractSignedAtModal({ open, dealId, dealTitle, initialDate, onClose, onSaved }: Props) {
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      const today = new Date().toISOString().slice(0, 10);
      setDate(initialDate ? initialDate.slice(0, 10) : today);
    }
  }, [open, initialDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) return;
    setSubmitting(true);
    setError('');
    try {
      await dealsApi.update(dealId, { contractSignedAt: date });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    }
    setSubmitting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Data de assinatura do contrato" zIndex={70}>
      <form onSubmit={submit} className="space-y-3">
        {dealTitle && (
          <p className="text-sm text-gray-600">
            Negócio: <strong>{dealTitle}</strong>
          </p>
        )}
        <p className="text-xs text-gray-500">
          Esta data será usada para calcular a estimativa de comissões (regra: mês da assinatura + 2 meses).
        </p>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data de assinatura *</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
