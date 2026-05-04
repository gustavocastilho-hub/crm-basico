import { useEffect, useMemo, useState } from 'react';
import { commissionsApi, Commission, EligibleDeal } from '../api/commissions.api';
import { usersApi } from '../api/users.api';
import { DateRangePicker, usePersistedDateRange, dateUtils } from '../components/ui/DateRangePicker';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

type SortKey = 'user' | 'dealTitle' | 'client' | 'value' | 'percentage' | 'commission' | 'closedAt';
type SortDir = 'asc' | 'desc';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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

  const [filters, setFilters] = useState<Record<SortKey, string>>({
    user: '', dealTitle: '', client: '', value: '', percentage: '', commission: '', closedAt: '',
  });
  const [sortKey, setSortKey] = useState<SortKey>('closedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [createOpen, setCreateOpen] = useState(false);
  const [eligibleDeals, setEligibleDeals] = useState<EligibleDeal[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({ dealId: '', userId: '', percentage: '10', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Commission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Commission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await commissionsApi.list(range.start, range.end);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [range.start, range.end]);

  const openCreate = async () => {
    setCreateOpen(true);
    try {
      const [deals, us] = await Promise.all([
        commissionsApi.eligibleDeals(),
        usersApi.listMinimal(),
      ]);
      setEligibleDeals(deals.data);
      setUsers(us.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar opções');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await commissionsApi.create({
        dealId: createForm.dealId,
        userId: createForm.userId,
        percentage: parseFloat(createForm.percentage),
        notes: createForm.notes || null,
      });
      setCreateOpen(false);
      setCreateForm({ dealId: '', userId: '', percentage: '10', notes: '' });
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao criar');
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await commissionsApi.update(editing.id, {
        percentage: parseFloat(editing.percentage),
        notes: editing.notes || null,
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

  const rows = useMemo(() => {
    return items.map((c) => {
      const dealValue = c.deal.value ? parseFloat(c.deal.value) : 0;
      const pct = parseFloat(c.percentage);
      return {
        c,
        user: c.user.name,
        dealTitle: c.deal.title,
        client: c.deal.client.name,
        value: dealValue,
        percentage: pct,
        commission: dealValue * (pct / 100),
        closedAt: c.deal.closedAt ? c.deal.closedAt.slice(0, 10) : '',
      };
    });
  }, [items]);

  const filteredSorted = useMemo(() => {
    const fl = (val: string | number | null | undefined, q: string) =>
      !q || (val ?? '').toString().toLowerCase().includes(q.toLowerCase());
    const arr = rows.filter((r) =>
      fl(r.user, filters.user) &&
      fl(r.dealTitle, filters.dealTitle) &&
      fl(r.client, filters.client) &&
      fl(r.value, filters.value) &&
      fl(r.percentage, filters.percentage) &&
      fl(r.commission, filters.commission) &&
      fl(r.closedAt, filters.closedAt)
    );
    arr.sort((a, b) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, filters, sortKey, sortDir]);

  const totalCommission = filteredSorted.reduce((sum, r) => sum + r.commission, 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const headers: { key: SortKey; label: string }[] = [
    { key: 'user', label: 'Vendedor' },
    { key: 'dealTitle', label: 'Negócio' },
    { key: 'client', label: 'Cliente' },
    { key: 'value', label: 'Valor' },
    { key: 'percentage', label: '%' },
    { key: 'commission', label: 'Comissão' },
    { key: 'closedAt', label: 'Fechado em' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Comissões</h1>
        {isAdmin && (
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            + Nova comissão
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-sm text-gray-700">
            Total no período: <strong>{formatCurrency(totalCommission)}</strong>
          </div>
          <DateRangePicker value={range} onChange={setRange} align="right" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {headers.map((h) => (
                  <th key={h.key} className="text-left py-2 px-2 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort(h.key)}>
                    {h.label}{sortIcon(h.key)}
                  </th>
                ))}
                {isAdmin && <th className="py-2 px-2 text-gray-700">Ações</th>}
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                {headers.map((h) => (
                  <th key={h.key} className="px-1 py-1">
                    <input type="text" value={filters[h.key]} placeholder="Filtrar..."
                      onChange={(e) => setFilters({ ...filters, [h.key]: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                  </th>
                ))}
                {isAdmin && <th className="px-1 py-1"></th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={headers.length + 1} className="text-center py-4 text-gray-500">Carregando…</td></tr>}
              {!loading && filteredSorted.length === 0 && (
                <tr><td colSpan={headers.length + 1} className="text-center py-4 text-gray-500">Nenhuma comissão registrada.</td></tr>
              )}
              {filteredSorted.map((r, idx) => (
                <tr key={r.c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 whitespace-nowrap">{r.user}</td>
                  <td className="px-2 py-2">{r.dealTitle}</td>
                  <td className="px-2 py-2">{r.client}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(r.value)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.percentage.toFixed(2)}%</td>
                  <td className="px-2 py-2 whitespace-nowrap font-semibold">{formatCurrency(r.commission)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.closedAt ? dateUtils.formatBr(r.closedAt) : '—'}</td>
                  {isAdmin && (
                    <td className="px-2 py-2 whitespace-nowrap">
                      <button onClick={() => setEditing(r.c)} className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-2">Editar</button>
                      <button onClick={() => setDeleteTarget(r.c)} className="text-red-500 hover:text-red-700 text-sm font-medium">Excluir</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova comissão">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Negócio (vendas ganhas)</label>
            <select required value={createForm.dealId}
              onChange={(e) => setCreateForm({ ...createForm, dealId: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Selecione…</option>
              {eligibleDeals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} — {d.client.name} {d.value ? `(${formatCurrency(parseFloat(d.value))})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Vendedor</label>
            <select required value={createForm.userId}
              onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Selecione…</option>
              {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Porcentagem (%)</label>
            <input type="number" step="0.01" min="0" max="100" required value={createForm.percentage}
              onChange={(e) => setCreateForm({ ...createForm, percentage: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notas</label>
            <textarea rows={2} value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar comissão">
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="text-sm text-gray-600">
              <div><strong>Vendedor:</strong> {editing.user.name}</div>
              <div><strong>Negócio:</strong> {editing.deal.title} — {editing.deal.client.name}</div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Porcentagem (%)</label>
              <input type="number" step="0.01" min="0" max="100" required value={editing.percentage}
                onChange={(e) => setEditing({ ...editing, percentage: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notas</label>
              <textarea rows={2} value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
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
        message={`Excluir esta comissão?`}
        loading={deleting}
      />
    </div>
  );
}
