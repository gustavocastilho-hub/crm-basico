import { useEffect, useState } from 'react';
import { commissionsApi, Commission, CommissionStatus, CommissionType } from '../api/commissions.api';
import { DateRangePicker, usePersistedDateRange, dateUtils } from '../components/ui/DateRangePicker';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { CommissionWizard } from '../components/commissions/CommissionWizard';
import { EstimateCard } from '../components/commissions/EstimateCard';
import { MarkPaidModal } from '../components/commissions/MarkPaidModal';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const labelType = (t: CommissionType) => (t === 'SDR' ? 'SDR' : t === 'NON_SDR' ? 'Não-SDR' : 'Outro');

export function CommissionsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const sixtyAgo = new Date();
  sixtyAgo.setDate(today.getDate() - 60);
  const [range, setRange] = usePersistedDateRange('commissions.range', {
    start: dateUtils.toIso(sixtyAgo),
    end: dateUtils.toIso(today),
  });

  const [statusFilter, setStatusFilter] = useState<'' | CommissionStatus>('PAID');
  const [monthFilter, setMonthFilter] = useState('');
  const [estimateKey, setEstimateKey] = useState(0);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'OTHER' as CommissionType,
    implementationFee: '0',
    percentage: '0',
    paidAmount: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Commission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [payTarget, setPayTarget] = useState<Commission | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await commissionsApi.list({
        startDate: range.start,
        endDate: range.end,
        referenceMonth: monthFilter || undefined,
        status: statusFilter || undefined,
      });
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar');
    }
    setLoading(false);
    setEstimateKey((k) => k + 1);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end, statusFilter, monthFilter]);

  const openEdit = (c: Commission) => {
    setEditing(c);
    setEditForm({
      type: c.type,
      implementationFee: c.implementationFee,
      percentage: c.percentage,
      paidAmount: c.paidAmount ?? '',
      notes: c.notes ?? '',
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await commissionsApi.update(editing.id, {
        type: editForm.type,
        implementationFee: parseFloat(editForm.implementationFee) || 0,
        percentage: parseFloat(editForm.percentage) || 0,
        paidAmount: editForm.paidAmount === '' ? null : parseFloat(editForm.paidAmount),
        notes: editForm.notes || null,
      });
      setEditing(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await commissionsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
    setDeleting(false);
  };

  const toggleUnpay = async (c: Commission) => {
    try {
      await commissionsApi.unpay(c.id);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar');
    }
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold">Comissões pagas</h2>
            <DateRangePicker value={range} onChange={setRange} align="right" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mês ref.</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Todos</option>
                <option value="UNPAID">Não pago</option>
                <option value="PAID">Pago</option>
              </select>
            </div>
            {monthFilter && (
              <button
                onClick={() => setMonthFilter('')}
                className="self-end px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                Limpar mês
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Mês ref.</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Negócio</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Taxa</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">%</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Comissão</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                {isAdmin && <th className="py-2 px-2 text-gray-700">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center py-4 text-gray-500">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center py-4 text-gray-500">
                    Nenhuma comissão registrada.
                  </td>
                </tr>
              )}
              {items.map((c, idx) => {
                const calc = parseFloat(c.calculatedAmount || '0');
                const paid = c.paidAmount !== null ? parseFloat(c.paidAmount) : null;
                const showSplit = paid !== null && paid !== calc;
                return (
                  <tr key={c.id} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-2 py-2 whitespace-nowrap">{c.referenceMonth}</td>
                    <td className="px-2 py-2">{c.deal.title}</td>
                    <td className="px-2 py-2">{c.deal.client.name}</td>
                    <td className="px-2 py-2">{labelType(c.type)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(parseFloat(c.implementationFee))}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{parseFloat(c.percentage).toFixed(2)}%</td>
                    <td className="px-2 py-2 whitespace-nowrap font-semibold">
                      {showSplit ? (
                        <div className="text-xs leading-tight">
                          <div>Calc.: {formatCurrency(calc)}</div>
                          <div>Pago: {formatCurrency(paid!)}</div>
                        </div>
                      ) : (
                        formatCurrency(calc)
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.status === 'PAID' ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Pago</span>
                          {c.paidAt && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {dateUtils.formatBr(c.paidAt.slice(0, 10))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                          Não pago
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2 whitespace-nowrap text-xs">
                        <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-700 font-medium mr-2">
                          Editar
                        </button>
                        {c.status === 'UNPAID' ? (
                          <button onClick={() => setPayTarget(c)} className="text-green-600 hover:text-green-700 font-medium mr-2">
                            Marcar pago
                          </button>
                        ) : (
                          <button onClick={() => toggleUnpay(c)} className="text-yellow-700 hover:text-yellow-800 font-medium mr-2">
                            Desmarcar
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(c)} className="text-red-500 hover:text-red-700 font-medium">
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CommissionWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={fetchItems} />

      <MarkPaidModal
        open={!!payTarget}
        commission={payTarget}
        onClose={() => setPayTarget(null)}
        onSaved={fetchItems}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar comissão">
        {editing && (
          <form onSubmit={submitEdit} className="space-y-3">
            <div className="text-sm text-gray-600">
              <div><strong>Negócio:</strong> {editing.deal.title} — {editing.deal.client.name}</div>
              <div><strong>Mês ref.:</strong> {editing.referenceMonth}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CommissionType })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="SDR">SDR</option>
                  <option value="NON_SDR">Não-SDR</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Porcentagem (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={editForm.percentage}
                  onChange={(e) => setEditForm({ ...editForm, percentage: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Taxa implementação (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editForm.implementationFee}
                  onChange={(e) => setEditForm({ ...editForm, implementationFee: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Valor pago manual (vazio = igual ao calculado)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.paidAmount}
                  onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notas</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir comissão"
        message="Excluir esta comissão?"
        loading={deleting}
      />
    </div>
  );
}
