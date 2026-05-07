import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { commissionsApi, Commission } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  open: boolean;
  commissions: Commission[];
  onClose: () => void;
  onSaved: () => void;
}

interface Row {
  commissionId: string;
  title: string;
  remaining: number;
  amount: string;
}

export function BatchPaymentsModal({ open, commissions, onClose, onSaved }: Props) {
  const [paidAt, setPaidAt] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPaidAt(new Date().toISOString().slice(0, 10));
      setReceipt(null);
      setNotes('');
      setError('');
      setRows(
        commissions.map((c) => {
          const calc = parseFloat(c.calculatedAmount);
          const paid = parseFloat(c.paidAmount || '0');
          const remaining = Math.max(calc - paid, 0);
          return {
            commissionId: c.id,
            title: `${c.deal.title} (${c.deal.client.name})`,
            remaining,
            amount: remaining.toFixed(2),
          };
        }),
      );
    }
  }, [open, commissions]);

  const fillAll = (factor: number) => {
    setRows((prev) => prev.map((r) => ({ ...r, amount: (r.remaining * factor).toFixed(2) })));
  };

  const totalToPay = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      for (const r of rows) {
        const value = parseFloat(r.amount);
        if (isNaN(value) || value <= 0) continue;
        const fd = new FormData();
        fd.append('amount', String(value));
        fd.append('paidAt', paidAt);
        if (notes) fd.append('notes', notes);
        if (receipt) fd.append('receipt', receipt);
        await commissionsApi.addPayment(r.commissionId, fd);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao registrar pagamentos');
    }
    setSubmitting(false);
  };

  if (commissions.length === 0) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pagamento em lote" zIndex={70}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs text-gray-600 mb-1">Recibo (mesmo arquivo para todas)</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            placeholder="Ex.: 50% antecipado de junho"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fillAll(1)}
            className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
          >
            Quitar restante
          </button>
          <button
            type="button"
            onClick={() => fillAll(0.5)}
            className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
          >
            50% do restante
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-2 py-1.5 text-left">Comissão</th>
                <th className="px-2 py-1.5 text-right">Restante</th>
                <th className="px-2 py-1.5 text-right">Valor a pagar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.commissionId} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-1.5">{r.title}</td>
                  <td className="px-2 py-1.5 text-right text-xs text-gray-600">
                    {formatCurrency(r.remaining)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.amount}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, amount: e.target.value } : p)),
                        )
                      }
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-semibold">
                <td className="px-2 py-2 text-right" colSpan={2}>
                  Total
                </td>
                <td className="px-2 py-2 text-right">{formatCurrency(totalToPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : `Registrar ${rows.length} pagamento(s)`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
