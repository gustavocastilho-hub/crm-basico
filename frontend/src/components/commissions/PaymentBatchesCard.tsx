import { useEffect, useState } from 'react';
import { commissionsApi, PaymentBatchSummary } from '../../api/commissions.api';
import { PaymentBatchDetailModal } from './PaymentBatchDetailModal';

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Pagamentos de comissões</h2>
          <p className="text-xs text-gray-500 mt-1">
            Cada cartão é um pagamento (lote) registrado para uma ou mais comissões. Clique para ver o
            detalhe.
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
        <p className="text-sm text-gray-500 py-6 text-center">Nenhum pagamento registrado neste mês.</p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <button
                key={b.batchId}
                onClick={() => setOpenBatchId(b.batchId)}
                className="text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-3 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-semibold text-gray-700">{formatDate(b.paidAt)}</div>
                  <div className="text-base font-bold text-green-700">
                    {formatCurrency(b.totalAmount)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {b.paymentsCount} comissão(ões) · ref. {b.referenceMonth}
                </div>
                <ul className="text-xs text-gray-700 space-y-0.5">
                  {b.deals.slice(0, 4).map((d) => (
                    <li key={d.id} className="truncate">
                      • {d.title} <span className="text-gray-500">({d.clientName})</span>
                    </li>
                  ))}
                  {b.deals.length > 4 && (
                    <li className="text-gray-500 italic">+ {b.deals.length - 4} outro(s)</li>
                  )}
                </ul>
              </button>
            ))}
          </div>
          <div className="mt-4 text-right text-sm">
            <span className="font-semibold">Total no mês: </span>
            <span className="text-base font-bold">{formatCurrency(total)}</span>
          </div>
        </>
      )}

      <PaymentBatchDetailModal
        open={!!openBatchId}
        batchId={openBatchId}
        onClose={() => setOpenBatchId(null)}
      />
    </div>
  );
}
