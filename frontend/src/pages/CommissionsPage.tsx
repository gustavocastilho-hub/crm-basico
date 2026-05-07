import { useEffect, useMemo, useState } from 'react';
import { commissionsApi, Commission, CommissionType, CommissionStatus } from '../api/commissions.api';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { CommissionWizard } from '../components/commissions/CommissionWizard';
import { EstimateCard } from '../components/commissions/EstimateCard';
import { BatchEditModal } from '../components/commissions/BatchEditModal';
import { PaymentsModal } from '../components/commissions/PaymentsModal';
import { BatchPaymentsModal } from '../components/commissions/BatchPaymentsModal';
import { PaymentBatchesCard } from '../components/commissions/PaymentBatchesCard';

const shiftMonth = (yyyymm: string, delta: number) => {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const labelType = (t: CommissionType) => (t === 'SDR' ? 'SDR' : t === 'NON_SDR' ? 'Não-SDR' : 'Outro');

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

export function CommissionsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [estimateKey, setEstimateKey] = useState(0);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentsCommission, setPaymentsCommission] = useState<Commission | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await commissionsApi.list({ referenceMonth: monthFilter || undefined });
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar');
    }
    setLoading(false);
    setEstimateKey((k) => k + 1);
  };

  useEffect(() => {
    fetchItems();
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((c) => c.id)));
  };

  const selectedCommissions = useMemo(
    () => items.filter((c) => selectedIds.has(c.id)),
    [items, selectedIds],
  );

  const total = useMemo(
    () => items.reduce((s, c) => s + parseFloat(c.calculatedAmount || '0'), 0),
    [items],
  );

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await Promise.all(items.map((c) => commissionsApi.remove(c.id)));
      setConfirmDelete(false);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Comissões</h1>
        {isAdmin && (
          <button
            onClick={() => setWizardOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Nova comissão
          </button>
        )}
      </div>

      <EstimateCard refreshKey={estimateKey} />

      {isAdmin && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Comissões do mês — {monthLabel(monthFilter)}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthFilter(shiftMonth(monthFilter, -1))}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={() => setMonthFilter(shiftMonth(monthFilter, 1))}
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
          <p className="text-sm text-gray-500 py-6 text-center">Nenhuma comissão registrada para {monthLabel(monthFilter)}.</p>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[900px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {isAdmin && (
                      <th className="px-2 py-2 w-8">
                        <input
                          type="checkbox"
                          checked={items.length > 0 && selectedIds.size === items.length}
                          onChange={toggleSelectAll}
                          aria-label="Selecionar todas"
                        />
                      </th>
                    )}
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Negócio</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Taxa</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">%</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Comissão</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Pago / Total</th>
                    {isAdmin && <th className="px-2 py-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((c, idx) => {
                    const info = statusInfo(c.status);
                    const calc = parseFloat(c.calculatedAmount);
                    const paid = parseFloat(c.paidAmount || '0');
                    return (
                      <tr key={c.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                        {isAdmin && (
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Selecionar ${c.deal.title}`}
                            />
                          </td>
                        )}
                        <td className="px-2 py-2">{c.deal.title}</td>
                        <td className="px-2 py-2">{c.deal.client.name}</td>
                        <td className="px-2 py-2">{labelType(c.type)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(parseFloat(c.implementationFee))}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{parseFloat(c.percentage).toFixed(2)}%</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap font-semibold">{formatCurrency(calc)}</td>
                        <td className="px-2 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${info.cls}`}>
                            {info.label}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap text-xs">
                          {formatCurrency(paid)} / {formatCurrency(calc)}
                        </td>
                        {isAdmin && (
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => setPaymentsCommission(c)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Pagamentos
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={isAdmin ? 6 : 5} className="px-2 py-3 text-right">Total</td>
                    <td className="px-2 py-3 text-right text-base">{formatCurrency(total)}</td>
                    <td colSpan={isAdmin ? 3 : 2}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <button
                  onClick={() => setBatchOpen(true)}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pagar selecionadas ({selectedIds.size})
                </button>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {isAdmin && <PaymentBatchesCard refreshKey={estimateKey} initialMonth={monthFilter} />}

      <CommissionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={fetchItems} />

      <BatchEditModal
        open={editOpen}
        items={items}
        referenceMonth={monthFilter}
        onClose={() => setEditOpen(false)}
        onSaved={fetchItems}
      />

      <PaymentsModal
        open={!!paymentsCommission}
        commission={paymentsCommission}
        onClose={() => setPaymentsCommission(null)}
        onSaved={fetchItems}
      />

      <BatchPaymentsModal
        open={batchOpen}
        commissions={selectedCommissions}
        onClose={() => setBatchOpen(false)}
        onSaved={() => {
          fetchItems();
          setSelectedIds(new Set());
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteAll}
        title="Excluir comissões do mês"
        message={`Excluir todas as ${items.length} comissões de ${monthLabel(monthFilter)}?`}
        loading={deleting}
      />
    </div>
  );
}
