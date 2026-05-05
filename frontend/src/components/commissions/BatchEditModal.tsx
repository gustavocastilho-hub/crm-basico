import { useEffect, useMemo, useState } from 'react';
import { commissionsApi, Commission, CommissionType } from '../../api/commissions.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const monthLabel = (yyyymm: string) => {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) return yyyymm;
  const [y, m] = yyyymm.split('-').map(Number);
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${names[m - 1]}/${y}`;
};

interface Row {
  id: string;
  dealTitle: string;
  clientName: string;
  type: CommissionType;
  implementationFee: number;
  percentage: number;
}

interface Props {
  open: boolean;
  items: Commission[];
  referenceMonth: string;
  onClose: () => void;
  onSaved: () => void;
}

export function BatchEditModal({ open, items, referenceMonth, onClose, onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setRows(
      items.map((c) => ({
        id: c.id,
        dealTitle: c.deal.title,
        clientName: c.deal.client.name,
        type: c.type,
        implementationFee: parseFloat(c.implementationFee) || 0,
        percentage: parseFloat(c.percentage) || 0,
      })),
    );
  }, [open, items]);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.implementationFee * (r.percentage / 100), 0),
    [rows],
  );

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await Promise.all(
        rows.map((r) =>
          commissionsApi.update(r.id, {
            type: r.type,
            implementationFee: Number(r.implementationFee) || 0,
            percentage: Number(r.percentage) || 0,
          }),
        ),
      );
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar');
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-stretch sm:items-center justify-center" style={{ zIndex: 60 }}>
      <div className="bg-white w-full sm:max-w-5xl sm:mx-4 sm:rounded-xl shadow-xl max-h-[100dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Editar comissões — {monthLabel(referenceMonth)}</h2>
            <p className="text-xs text-gray-500">{rows.length} negócio(s)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2" aria-label="Fechar">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-2 py-2">Negócio</th>
                  <th className="text-left px-2 py-2">Taxa implementação</th>
                  <th className="text-left px-2 py-2">Tipo comissão</th>
                  <th className="text-left px-2 py-2">% comissão</th>
                  <th className="text-right px-2 py-2">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const valor = (Number(r.implementationFee) || 0) * ((Number(r.percentage) || 0) / 100);
                  return (
                    <tr key={r.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 py-2">
                        <div className="font-medium">{r.dealTitle}</div>
                        <div className="text-xs text-gray-500">{r.clientName}</div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.implementationFee}
                          onChange={(e) => updateRow(idx, { implementationFee: parseFloat(e.target.value) || 0 })}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={r.type}
                          onChange={(e) => updateRow(idx, { type: e.target.value as CommissionType })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="SDR">SDR</option>
                          <option value="NON_SDR">Não-SDR</option>
                          <option value="OTHER">Outro</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={r.percentage}
                          onChange={(e) => updateRow(idx, { percentage: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">{formatCurrency(valor)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-bold">
                  <td colSpan={4} className="px-2 py-3 text-right">Total</td>
                  <td className="px-2 py-3 text-right text-base">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
