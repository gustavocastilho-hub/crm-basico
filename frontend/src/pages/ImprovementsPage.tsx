import { useEffect, useMemo, useState } from 'react';
import { improvementsApi, ImprovementRequest } from '../api/improvements.api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

type SortKey = 'title' | 'user' | 'createdAt' | 'implemented' | 'implementedAt';
type SortDir = 'asc' | 'desc';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');

export function ImprovementsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<ImprovementRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<ImprovementRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImprovementRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<Record<SortKey, string>>({
    title: '', user: '', createdAt: '', implemented: '', implementedAt: '',
  });
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete' | 'mark_implemented' | 'mark_pending'>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await improvementsApi.list();
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await improvementsApi.create({
        title: form.title,
        description: form.description || null,
      });
      setForm({ title: '', description: '' });
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await improvementsApi.update(editing.id, {
        title: editing.title,
        description: editing.description || null,
      });
      setEditing(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar');
    }
    setSubmitting(false);
  };

  const handleToggleImplemented = async (it: ImprovementRequest) => {
    try {
      await improvementsApi.setImplemented(it.id, !it.implemented);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await improvementsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir');
    }
    setDeleting(false);
  };

  const filteredSorted = useMemo(() => {
    const fl = (val: string | null | undefined, q: string) =>
      !q || (val ?? '').toString().toLowerCase().includes(q.toLowerCase());
    const arr = items.filter((it) =>
      fl(it.title, filters.title) &&
      fl(it.user.name, filters.user) &&
      fl(it.createdAt, filters.createdAt) &&
      fl(it.implemented ? 'sim' : 'não', filters.implemented) &&
      fl(it.implementedAt ?? '', filters.implementedAt)
    );
    arr.sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'user') { va = a.user.name; vb = b.user.name; }
      else if (sortKey === 'implemented') { va = a.implemented ? 1 : 0; vb = b.implemented ? 1 : 0; }
      else { va = (a as any)[sortKey] ?? ''; vb = (b as any)[sortKey] ?? ''; }
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const cmp = String(va).localeCompare(String(vb), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, filters, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const allSelected = filteredSorted.length > 0 && filteredSorted.every((it) => selected.has(it.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredSorted.map((it) => it.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const runBulk = async () => {
    if (!bulkConfirm) return;
    setBulkBusy(true);
    try {
      await improvementsApi.bulk(Array.from(selected), bulkConfirm);
      setSelected(new Set());
      setBulkConfirm(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro na ação em massa');
    }
    setBulkBusy(false);
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: 'createdAt', label: 'Enviado em' },
    { key: 'title', label: 'Título' },
    { key: 'user', label: 'Por' },
    { key: 'implemented', label: 'Status' },
    { key: 'implementedAt', label: 'Implementado em' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Pedidos de Melhorias</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Novo pedido</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Título</label>
            <input type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descrição (opcional)</label>
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Pedidos enviados</h2>
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 self-center">{selected.size} selecionado(s)</span>
              {isAdmin && (
                <>
                  <button onClick={() => setBulkConfirm('mark_implemented')} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    Marcar como implementado
                  </button>
                  <button onClick={() => setBulkConfirm('mark_pending')} className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                    Marcar como pendente
                  </button>
                </>
              )}
              <button onClick={() => setBulkConfirm('delete')} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                Excluir
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-2 py-2 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                {headers.map((h) => (
                  <th key={h.key} className="text-left py-2 px-2 font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort(h.key)}>
                    {h.label}{sortIcon(h.key)}
                  </th>
                ))}
                <th className="py-2 px-2 text-gray-700">Ações</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-1"></th>
                {headers.map((h) => (
                  <th key={h.key} className="px-1 py-1">
                    <input type="text" value={filters[h.key]} placeholder="Filtrar..."
                      onChange={(e) => setFilters({ ...filters, [h.key]: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                  </th>
                ))}
                <th className="px-1 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4 text-gray-500">Carregando…</td></tr>}
              {!loading && filteredSorted.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4 text-gray-500">Nenhum pedido.</td></tr>
              )}
              {filteredSorted.map((it, idx) => (
                <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2">
                    <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggleOne(it.id)} />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatDateTime(it.createdAt)}</td>
                  <td className="px-2 py-2">
                    <div className="font-medium">{it.title}</div>
                    {it.description && <div className="text-xs text-gray-500 line-clamp-2">{it.description}</div>}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{it.user.name}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {it.implemented ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Implementado</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Pendente</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {it.implementedAt ? formatDateTime(it.implementedAt) : '—'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {(isAdmin || it.userId === user?.id) && (
                      <button onClick={() => setEditing(it)} className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-2">Editar</button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleToggleImplemented(it)} className="text-green-600 hover:text-green-700 text-sm font-medium mr-2">
                        {it.implemented ? 'Desmarcar' : 'Marcar OK'}
                      </button>
                    )}
                    {(isAdmin || it.userId === user?.id) && (
                      <button onClick={() => setDeleteTarget(it)} className="text-red-500 hover:text-red-700 text-sm font-medium">Excluir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar pedido">
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Título</label>
              <input type="text" required value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Descrição</label>
              <textarea rows={4} value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
        title="Excluir pedido"
        message={`Excluir "${deleteTarget?.title}"?`}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={runBulk}
        title={
          bulkConfirm === 'delete' ? 'Excluir selecionados' :
          bulkConfirm === 'mark_implemented' ? 'Marcar como implementados' :
          'Marcar como pendentes'
        }
        message={`Aplicar ação a ${selected.size} pedido(s)?`}
        loading={bulkBusy}
      />
    </div>
  );
}
