import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { commissionsApi, PaymentBatchDetail } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const labelType = (t: 'SDR' | 'NON_SDR' | 'OTHER') =>
  t === 'SDR' ? 'SDR' : t === 'NON_SDR' ? 'Não-SDR' : 'Outro';

interface Props {
  open: boolean;
  batchId: string | null;
  onClose: () => void;
}

export function PaymentBatchDetailModal({ open, batchId, onClose }: Props) {
  const [data, setData] = useState<PaymentBatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && batchId) {
      setLoading(true);
      setError('');
      setData(null);
      commissionsApi
        .getPaymentBatch(batchId)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.response?.data?.message || 'Erro ao carregar lote'))
        .finally(() => setLoading(false));
    }
  }, [open, batchId]);

  return (
    <Modal open={open} onClose={onClose} title="Detalhe do pagamento" zIndex={70}>
      {loading && <p className="text-sm text-gray-500">Carregando…</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {data && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div>
              <strong>Data:</strong> {formatDate(data.paidAt)}
            </div>
            <div>
              <strong>Mês de referência:</strong> {data.referenceMonth}
            </div>
            <div>
              <strong>Total pago:</strong>{' '}
              <span className="text-green-700 font-semibold">{formatCurrency(data.totalAmount)}</span>
            </div>
            {data.receiptUrl && (
              <div>
                <strong>Recibo:</strong>{' '}
                <a
                  href={data.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {data.receiptName || 'Abrir'}
                </a>
              </div>
            )}
            {data.notes && (
              <div>
                <strong>Notas:</strong> {data.notes}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[640px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-2 py-2">Negócio</th>
                  <th className="text-left px-2 py-2">Cliente</th>
                  <th className="text-left px-2 py-2">Tipo</th>
                  <th className="text-left px-2 py-2">Taxa</th>
                  <th className="text-left px-2 py-2">%</th>
                  <th className="text-right px-2 py-2">Pago</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, idx) => (
                  <tr key={it.paymentId} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-2 py-2">{it.commission.deal.title}</td>
                    <td className="px-2 py-2">{it.commission.deal.client.name}</td>
                    <td className="px-2 py-2">{labelType(it.commission.type)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatCurrency(parseFloat(it.commission.implementationFee))}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {parseFloat(it.commission.percentage).toFixed(2)}%
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap font-semibold text-green-700">
                      {formatCurrency(it.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td colSpan={5} className="px-2 py-3 text-right">
                    Total pago
                  </td>
                  <td className="px-2 py-3 text-right text-base">{formatCurrency(data.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
