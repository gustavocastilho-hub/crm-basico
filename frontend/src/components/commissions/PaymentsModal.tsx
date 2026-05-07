import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { commissionsApi, Commission, CommissionPayment } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

interface Props {
  open: boolean;
  commission: Commission | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PaymentsModal({ open, commission, onClose, onSaved }: Props) {
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const calc = commission ? parseFloat(commission.calculatedAmount) : 0;
  const remaining = Math.max(calc - totalPaid, 0);

  const refresh = async () => {
    if (!commission) return;
    setLoading(true);
    try {
      const res = await commissionsApi.listPayments(commission.id);
      setPayments(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar pagamentos');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && commission) {
      setError('');
      setAmount(remaining > 0 ? remaining.toFixed(2) : commission.calculatedAmount);
      setPaidAt(new Date().toISOString().slice(0, 10));
      setNotes('');
      setReceipt(null);
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, commission?.id]);

  useEffect(() => {
    setAmount(remaining > 0 ? remaining.toFixed(2) : '0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPaid, calc]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commission) return;
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('amount', String(value));
      fd.append('paidAt', paidAt);
      if (notes) fd.append('notes', notes);
      if (receipt) fd.append('receipt', receipt);
      await commissionsApi.addPayment(commission.id, fd);
      setNotes('');
      setReceipt(null);
      await refresh();
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao registrar pagamento');
    }
    setSubmitting(false);
  };

  const removePayment = async (paymentId: string) => {
    if (!commission) return;
    if (!confirm('Excluir este pagamento?')) return;
    try {
      await commissionsApi.deletePayment(commission.id, paymentId);
      await refresh();
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir pagamento');
    }
  };

  if (!commission) return null;

  const status = commission.status;
  const statusLabel = status === 'PAID' ? 'Pago' : status === 'PARTIALLY_PAID' ? 'Parcial' : 'Em aberto';
  const statusClass =
    status === 'PAID'
      ? 'bg-green-100 text-green-800'
      : status === 'PARTIALLY_PAID'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-700';

  return (
    <Modal open={open} onClose={onClose} title="Pagamentos da comissão" zIndex={70}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <div><strong>Negócio:</strong> {commission.deal.title}</div>
              <div><strong>Cliente:</strong> {commission.deal.client.name}</div>
              <div><strong>Mês de referência:</strong> {commission.referenceMonth}</div>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-gray-500">Total da comissão</div>
              <div className="text-sm font-semibold">{formatCurrency(calc)}</div>
            </div>
            <div>
              <div className="text-gray-500">Pago</div>
              <div className="text-sm font-semibold text-green-700">{formatCurrency(totalPaid)}</div>
            </div>
            <div>
              <div className="text-gray-500">Restante</div>
              <div className="text-sm font-semibold text-orange-700">{formatCurrency(remaining)}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pagamentos registrados</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
          ) : (
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-2 py-1.5 text-left">Data</th>
                  <th className="px-2 py-1.5 text-right">Valor</th>
                  <th className="px-2 py-1.5 text-left">Recibo</th>
                  <th className="px-2 py-1.5 text-left">Notas</th>
                  <th className="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-200">
                    <td className="px-2 py-1.5">{formatDate(p.paidAt)}</td>
                    <td className="px-2 py-1.5 text-right">{formatCurrency(parseFloat(p.amount))}</td>
                    <td className="px-2 py-1.5">
                      {p.receiptUrl ? (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {p.receiptName || 'Ver recibo'}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-600">{p.notes || '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => removePayment(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={submit} className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Adicionar pagamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Valor *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
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
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              placeholder="Ex.: 50% antecipado"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Recibo (PDF ou imagem, opcional)</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : 'Registrar pagamento'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
