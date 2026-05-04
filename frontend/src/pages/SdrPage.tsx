import { useEffect, useMemo, useState } from 'react';
import { sdrApi, SdrContact, SdrContactInput } from '../api/sdr.api';
import { DateRangePicker, usePersistedDateRange, dateUtils } from '../components/ui/DateRangePicker';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type SortKey = 'contactDate' | 'contactTime' | 'name' | 'company' | 'whatsapp' | 'summary' | 'user';
type SortDir = 'asc' | 'desc';

const todayIso = () => dateUtils.toIso(new Date());

const emptyForm: SdrContactInput = {
  contactDate: todayIso(),
  contactTime: new Date().toTimeString().slice(0, 5),
  name: '',
  company: '',
  whatsapp: '',
  summary: '',
};

export function SdrPage() {
  const [items, setItems] = useState<SdrContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<SdrContactInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [range, setRange] = usePersistedDateRange('sdr.range', {
    start: dateUtils.toIso(startMonth),
    end: dateUtils.toIso(today),
  });

  const [editing, setEditing] = useState<SdrContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SdrContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<Record<SortKey, string>>({
    contactDate: '', contactTime: '', name: '', company: '', whatsapp: '', summary: '', user: '',
  });
  const [sortKey, setSortKey] = useState<SortKey>('contactDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await sdrApi.list(range.start, range.end);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar registros');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [range.start, range.end]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await sdrApi.create({
        ...form,
        company: form.company || null,
        whatsapp: form.whatsapp || null,
      });
      setForm({ ...emptyForm, contactDate: form.contactDate, contactTime: new Date().toTimeString().slice(0, 5) });
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar contato');
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await sdrApi.update(editing.id, {
        contactDate: editing.contactDate.slice(0, 10),
        contactTime: editing.contactTime,
        name: editing.name,
        company: editing.company || null,
        whatsapp: editing.whatsapp || null,
        summary: editing.summary,
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
      await sdrApi.remove(deleteTarget.id);
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
      fl(it.contactDate, filters.contactDate) &&
      fl(it.contactTime, filters.contactTime) &&
      fl(it.name, filters.name) &&
      fl(it.company, filters.company) &&
      fl(it.whatsapp, filters.whatsapp) &&
      fl(it.summary, filters.summary) &&
      fl(it.user.name, filters.user)
    );
    arr.sort((a, b) => {
      const va = sortKey === 'user' ? a.user.name : (a as any)[sortKey] ?? '';
      const vb = sortKey === 'user' ? b.user.name : (b as any)[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, filters, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const headers: { key: SortKey; label: string; width?: string }[] = [
    { key: 'contactDate', label: 'Dia' },
    { key: 'contactTime', label: 'Horário' },
    { key: 'name', label: 'Nome' },
    { key: 'company', label: 'Empresa' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'summary', label: 'Resumo' },
    { key: 'user', label: 'SDR' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Ligações/Mensagens SDR</h1>

      {/* Card de registro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Registrar contato</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dia</label>
            <input type="date" required value={form.contactDate}
              onChange={(e) => setForm({ ...form, contactDate: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Horário</label>
            <input type="time" required value={form.contactTime}
              onChange={(e) => setForm({ ...form, contactTime: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Empresa</label>
            <input type="text" value={form.company ?? ''}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">WhatsApp</label>
            <input type="text" value={form.whatsapp ?? ''}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <label className="block text-xs text-gray-600 mb-1">Resumo detalhado</label>
            <textarea required rows={3} value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Histórico</h2>
          <DateRangePicker value={range} onChange={setRange} align="right" />
        </div>

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
                <th className="py-2 px-2 text-gray-700">Ações</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
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
              {loading && <tr><td colSpan={headers.length + 1} className="text-center py-4 text-gray-500">Carregando…</td></tr>}
              {!loading && filteredSorted.length === 0 && (
                <tr><td colSpan={headers.length + 1} className="text-center py-4 text-gray-500">Nenhum registro encontrado.</td></tr>
              )}
              {filteredSorted.map((it, idx) => (
                <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 whitespace-nowrap">{dateUtils.formatBr(it.contactDate.slice(0, 10))}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{it.contactTime}</td>
                  <td className="px-2 py-2">{it.name}</td>
                  <td className="px-2 py-2">{it.company || '—'}</td>
                  <td className="px-2 py-2">{it.whatsapp || '—'}</td>
                  <td className="px-2 py-2 max-w-md"><span className="line-clamp-2 text-gray-700">{it.summary}</span></td>
                  <td className="px-2 py-2 whitespace-nowrap">{it.user.name}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button onClick={() => setEditing(it)} className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-2">Editar</button>
                    <button onClick={() => setDeleteTarget(it)} className="text-red-500 hover:text-red-700 text-sm font-medium">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar registro">
        {editing && (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dia</label>
                <input type="date" required value={editing.contactDate.slice(0, 10)}
                  onChange={(e) => setEditing({ ...editing, contactDate: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Horário</label>
                <input type="time" required value={editing.contactTime}
                  onChange={(e) => setEditing({ ...editing, contactTime: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nome</label>
              <input type="text" required value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Empresa</label>
                <input type="text" value={editing.company ?? ''}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">WhatsApp</label>
                <input type="text" value={editing.whatsapp ?? ''}
                  onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Resumo</label>
              <textarea required rows={4} value={editing.summary}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
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
        title="Excluir registro"
        message={`Excluir o contato com "${deleteTarget?.name}"?`}
        loading={deleting}
      />
    </div>
  );
}
