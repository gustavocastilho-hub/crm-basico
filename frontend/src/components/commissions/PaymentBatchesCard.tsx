import { useEffect, useState } from 'react';
import { commissionsApi, PaymentBatchSummary } from '../../api/commissions.api';
import { PaymentBatchDetailModal } from './PaymentBatchDetailModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

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

  const [month, setMonth] = useState(
    initialMonth ||
      (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })(),
  );
  const [items, setItems] = useState<PaymentBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await commissionsApi.listPaymentBatches(month);
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar pagamentos');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, refreshKey]);

  const total = items.reduce((s, b) => s + b.totalAmount, 0);
  const totalPayments = items.reduce((s, b) => s + b.paymentsCount, 0);

  const handleDelete = async () => {
    if (!deleteBatchId) return;
    setDeleting(true);
    try {
      await commissionsApi.deletePaymentBatch(deleteBatchId);
      setDeleteBatchId(null);
      await fetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir');
    }
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Pagamentos de comissões</h2>
          <p className="text-xs text-gray-500 mt-1">
            Filtro por mês da data do pagamento. Cada linha é um pagamento (lote) de uma ou mais
            comissões.
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
        <p className="text-sm text-gray-500 py-6 text-center">Nenhum pagamento neste mês.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[820px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Data</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Negócios</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Comissões</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Ref.</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Recibo</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Pago</th>
                {isAdmin && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((b, idx) => (
                <tr
                  key={b.batchId}
                  className={`${idx % 2 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 cursor-pointer`}
                  onClick={() => setOpenBatchId(b.batchId)}
                >
                  <td className="px-2 py-2 whitespace-nowrap">{formatDate(b.paidAt)}</td>
                  <td className="px-2 py-2">
                    <ul className="space-y-0.5">
                      {b.deals.slice(0, 3).map((d) => (
                        <li key={d.id} className="text-xs">
                          {d.title}{' '}
                          <span className="text-gray-500">({d.clientName})</span>
                        </li>
                      ))}
                      {b.deals.length > 3 && (
                        <li className="text-xs text-gray-500 italic">
                          + {b.deals.length - 3} outro(s)
                        </li>
                      )}
                    </ul>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{b.paymentsCount}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                    {b.referenceMonth}
                  </td>
                  <td className="px-2 py-2">
                    {b.receiptUrl ? (
                      <a
                        href={b.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {b.receiptName || 'Ver'}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap font-semibold text-green-700">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  {isAdmin && (
                    <td
                      className="px-2 py-2 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenBatchId(b.batchId)}
                        className="text-xs text-blue-600 hover:underline mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteBatchId(b.batchId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="px-2 py-3 text-right" colSpan={2}>
                  Total
                </td>
                <td className="px-2 py-3 text-right">{totalPayments}</td>
                <td colSpan={2}></td>
                <td className="px-2 py-3 text-right text-base">{formatCurrency(total)}</td>
                {isAdmin && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <PaymentBatchDetailModal
        open={!!openBatchId}
        batchId={openBatchId}
        onClose={() => setOpenBatchId(null)}
      />

      <ConfirmDialog
        open={!!deleteBatchId}
        onClose={() => setDeleteBatchId(null)}
        onConfirm={handleDelete}
        title="Excluir pagamento"
        message="Excluir este lote de pagamento? Os pagamentos individuais associados também serão removidos e o status das comissões será recalculado."
        loading={deleting}
      />
    </div>
  );
}
