import { useEffect, useMemo, useState } from 'react';
import { commissionsApi, PaymentRow, CommissionType, CommissionStatus, Commission } from '../../api/commissions.api';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import { PaymentsModal } from './PaymentsModal';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const labelType = (t: CommissionType) =>
  t === 'SDR' ? 'SDR' : t === 'NON_SDR' ? 'Não-SDR' : 'Outro';

const statusInfo = (s: CommissionStatus) => {
  if (s === 'PAID') return { label: 'Pago', cls: 'bg-green-100 text-green-800' };
  if (s === 'PARTIALLY_PAID') return { label: 'Parcial', cls: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Em aberto', cls: 'bg-gray-100 text-gray-700' };
};

const monthLabel = (yyyymm: string) => {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) return yyyymm;
  const [y, m] = yyyymm.split('-').map(Number);
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${names[m - 1]}/${y}`;
};

const shiftMonth = (yyyymm: string, delta: number) => {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

interface Props {
  refreshKey?: number;
  initialMonth?: string;
}

export function PaymentBatchesCard({ refreshKey = 0, initialMonth }: Props) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const currentMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const [month, setMonth] = useState(initialMonth || currentMonth);
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bumpKey, setBumpKey] = useState(0);

  const [paymentsCommission, setPaymentsCommission] = useState<Commission | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<{ paymentId: string; commissionId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await commissionsApi.listPaymentsByMonth(month);
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar pagamentos');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, refreshKey, bumpKey]);

  const totalPaid = useMemo(
    () => items.reduce((s, p) => s + parseFloat(p.amount || '0'), 0),
    [items],
  );
  const totalCommissions = useMemo(
    () => items.reduce((s, p) => s + parseFloat(p.commission.calculatedAmount || '0'), 0),
    [items],
  );

  const handleDelete = async () => {
    if (!deletePaymentId) return;
    setDeleting(true);
    try {
      await commissionsApi.deletePayment(deletePaymentId.commissionId, deletePaymentId.paymentId);
      setDeletePaymentId(null);
      setBumpKey((k) => k + 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir');
    }
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Pagamentos de comissões — {monthLabel(month)}</h2>
          <p className="text-xs text-gray-500 mt-1">
            Filtro pelo mês da data de pagamento. Cada linha é uma comissão paga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
      {loading && <p className="text-sm text-gray-500 py-4 text-center">Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 py-6 text-center">
          Nenhum pagamento registrado em {monthLabel(month)}.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Data</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Negócio</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Taxa</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">%</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Pago</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Total</th>
                {isAdmin && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => {
                const c = p.commission;
                const info = statusInfo(c.status);
                const calc = parseFloat(c.calculatedAmount);
                const paid = parseFloat(p.amount);
                return (
                  <tr key={p.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-2 py-2 whitespace-nowrap">{formatDate(p.paidAt)}</td>
                    <td className="px-2 py-2">{c.deal.title}</td>
                    <td className="px-2 py-2">{c.deal.client.name}</td>
                    <td className="px-2 py-2">{labelType(c.type)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatCurrency(parseFloat(c.implementationFee))}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {parseFloat(c.percentage).toFixed(2)}%
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${info.cls}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap text-green-700">
                      {formatCurrency(paid)}
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap font-semibold">
                      {formatCurrency(calc)}
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => setPaymentsCommission(c)}
                          className="text-xs text-blue-600 hover:underline mr-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            setDeletePaymentId({ paymentId: p.id, commissionId: c.id })
                          }
                          className="text-xs text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="bg-blue-50 font-bold">
                <td colSpan={7} className="px-2 py-3 text-right">
                  Total
                </td>
                <td className="px-2 py-3 text-right text-base text-green-700">
                  {formatCurrency(totalPaid)}
                </td>
                <td className="px-2 py-3 text-right text-base">{formatCurrency(totalCommissions)}</td>
                {isAdmin && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <PaymentsModal
        open={!!paymentsCommission}
        commission={paymentsCommission}
        onClose={() => setPaymentsCommission(null)}
        onSaved={() => setBumpKey((k) => k + 1)}
      />

      <ConfirmDialog
        open={!!deletePaymentId}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={handleDelete}
        title="Excluir pagamento"
        message="Excluir este pagamento? O status da comissão será recalculado."
        loading={deleting}
      />
    </div>
  );
}
