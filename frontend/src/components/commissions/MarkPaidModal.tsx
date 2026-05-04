import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { commissionsApi, Commission } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  open: boolean;
  commission: Commission | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MarkPaidModal({ open, commission, onClose, onSaved }: Props) {
  const [paidAt, setPaidAt] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && commission) {
      const today = new Date();
      setPaidAt(today.toISOString().slice(0, 10));
      setPaidAmount(commission.calculatedAmount);
      setError('');
    }
  }, [open, commission]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;
    setSubmitting(true);
    setError('');
    try {
      const calc = parseFloat(commission.calculatedAmount);
      const entered = parseFloat(paidAmount);
      const amount = !isNaN(entered) && entered !== calc ? entered : undefined;
      await commissionsApi.pay(commission.id, paidAt, amount);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao marcar como pago');
    }
    setSubmitting(false);
  };

  if (!commission) return null;

  return (
    <Modal open={open} onClose={onClose} title="Marcar como pago" zIndex={70}>
      <form onSubmit={submit} className="space-y-3">
        <div className="text-sm text-gray-600">
          <div><strong>Negócio:</strong> {commission.deal.title}</div>
          <div><strong>Valor calculado:</strong> {formatCurrency(parseFloat(commission.calculatedAmount))}</div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data do pagamento *</label>
          <input
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Valor pago (deixe igual ao calculado para usar o padrão)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Salvando…' : 'Confirmar pagamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
