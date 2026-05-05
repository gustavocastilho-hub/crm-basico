import { useEffect, useState } from 'react';
import { commissionsApi, EstimateResponse } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (yyyymm: string, delta: number) => {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const labelType = (t: 'SDR' | 'NON_SDR' | 'OTHER') =>
  t === 'SDR' ? 'SDR' : t === 'NON_SDR' ? 'Não-SDR' : 'Outro';

interface Props {
  refreshKey?: number;
}

export function EstimateCard({ refreshKey = 0 }: Props) {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await commissionsApi.estimate(month);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar estimativa');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, refreshKey]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Estimativa de comissões</h2>
          <p className="text-xs text-gray-500 mt-1">
            Comissões só entram 30 dias após o deal sair da etapa Contrato (avançar para Kick-off ou adiante).
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

      <div className="overflow-x-auto">
        {(() => {
          const items = data?.items ?? [];
          const total = items.reduce((s, i) => s + i.calculatedAmount, 0);
          return (
            <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[640px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-2 py-2">Negócio</th>
                  <th className="text-left px-2 py-2">Plano</th>
                  <th className="text-left px-2 py-2">Taxa</th>
                  <th className="text-left px-2 py-2">Tipo</th>
                  <th className="text-left px-2 py-2">%</th>
                  <th className="text-right px-2 py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="text-center py-4 text-gray-500">Carregando…</td></tr>}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-500">Nenhuma comissão estimada para {month}.</td></tr>
                )}
                {!loading && items.map((it, idx) => (
                  <tr key={`${it.deal.id}-${idx}`} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-2 py-2">
                      <div className="font-medium">{it.deal.title}</div>
                      <div className="text-xs text-gray-500">{it.deal.client.name}</div>
                    </td>
                    <td className="px-2 py-2">{it.plan?.name ?? '—'}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(it.implementationFee)}</td>
                    <td className="px-2 py-2">{labelType(it.type)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{it.percentage.toFixed(2)}%</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap font-semibold">{formatCurrency(it.calculatedAmount)}</td>
                  </tr>
                ))}
                {!loading && items.length > 0 && (
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={5} className="px-2 py-3 text-right">Total estimado</td>
                    <td className="px-2 py-3 text-right text-base">{formatCurrency(total)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}
