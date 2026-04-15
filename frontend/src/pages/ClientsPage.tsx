import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clientsApi } from '../api/clients.api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  owner: { id: string; name: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortDir = 'asc' | 'desc';
type ClientSortCol = 'name' | 'email' | 'phone' | 'company' | 'owner' | 'createdAt';

interface ColFilters {
  name: string;
  email: string;
  phone: string;
  company: string;
  owner: string;
  createdAt: string;
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [sortCol, setSortCol] = useState<ClientSortCol>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [colFilters, setColFilters] = useState<ColFilters>({
    name: '', email: '', phone: '', company: '', owner: '', createdAt: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchClients = useCallback(async (page = 1) => {
    const { data } = await clientsApi.list({ page, search: search || undefined });
    setClients(data.data);
    setPagination(data.pagination);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  useEffect(() => {
    const editId = (location.state as { editClientId?: string } | null)?.editClientId;
    if (!editId) return;
    const target = clients.find((c) => c.id === editId);
    if (target) {
      openEdit(target);
      navigate(location.pathname, { replace: true, state: null });
    } else {
      clientsApi.get(editId).then(({ data }) => {
        openEdit(data);
        navigate(location.pathname, { replace: true, state: null });
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, clients]);

  const handleSort = (col: ClientSortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const setFilter = (key: keyof ColFilters, value: string) =>
    setColFilters((prev) => ({ ...prev, [key]: value }));

  const displayedClients = useMemo(() => {
    let list = [...clients];
    const f = colFilters;
    if (f.name) list = list.filter((c) => c.name.toLowerCase().includes(f.name.toLowerCase()));
    if (f.email) list = list.filter((c) => (c.email || '').toLowerCase().includes(f.email.toLowerCase()));
    if (f.phone) list = list.filter((c) => (c.phone || '').toLowerCase().includes(f.phone.toLowerCase()));
    if (f.company) list = list.filter((c) => (c.company || '').toLowerCase().includes(f.company.toLowerCase()));
    if (f.owner) list = list.filter((c) => c.owner.name.toLowerCase().includes(f.owner.toLowerCase()));
    if (f.createdAt) list = list.filter((c) => formatDate(c.createdAt).includes(f.createdAt));

    list.sort((a, b) => {
      let av: string, bv: string;
      if (sortCol === 'owner') { av = a.owner.name; bv = b.owner.name; }
      else { av = String(a[sortCol] || ''); bv = String(b[sortCol] || ''); }
      const cmp = av.localeCompare(bv, 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [clients, colFilters, sortCol, sortDir]);

  const openCreate = () => {
    setEditClient(null);
    setForm({ name: '', email: '', phone: '', company: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditClient(client);
    setForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editClient) {
        await clientsApi.update(editClient.id, form);
      } else {
        await clientsApi.create(form);
      }
      setModalOpen(false);
      fetchClients(pagination.page);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await clientsApi.remove(deleteTarget.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      fetchClients(pagination.page);
    } catch {}
    setLoading(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(displayedClients.map((c) => c.id)));
    else clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await clientsApi.bulkRemove(Array.from(selectedIds));
      clearSelection();
      setBulkDeleteOpen(false);
      fetchClients(pagination.page);
    } catch {}
    setLoading(false);
  };

  const SortIcon = ({ col }: { col: ClientSortCol }) => (
    <span className="ml-1 text-gray-400 text-xs">
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const thClass = 'text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-100';
  const filterInput = 'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Novo Cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome, empresa ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm text-blue-800">
            {selectedIds.size} cliente(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Limpar seleção
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
            >
              Excluir selecionados
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={displayedClients.length > 0 && displayedClients.every((c) => selectedIds.has(c.id))}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  title="Selecionar todos"
                  className="cursor-pointer"
                />
              </th>
              <th className={thClass} onClick={() => handleSort('name')}>
                Nome <SortIcon col="name" />
              </th>
              <th className={thClass} onClick={() => handleSort('email')}>
                Email <SortIcon col="email" />
              </th>
              <th className={thClass} onClick={() => handleSort('phone')}>
                Telefone <SortIcon col="phone" />
              </th>
              <th className={thClass} onClick={() => handleSort('company')}>
                Empresa <SortIcon col="company" />
              </th>
              <th className={thClass} onClick={() => handleSort('owner')}>
                Responsável <SortIcon col="owner" />
              </th>
              <th className={thClass} onClick={() => handleSort('createdAt')}>
                Criado em <SortIcon col="createdAt" />
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
            <tr className="bg-gray-50 border-t border-gray-100">
              <th className="px-4 py-1" />
              <th className="px-4 py-1">
                <input value={colFilters.name} onChange={(e) => setFilter('name', e.target.value)} placeholder="Filtrar..." className={filterInput} />
              </th>
              <th className="px-4 py-1">
                <input value={colFilters.email} onChange={(e) => setFilter('email', e.target.value)} placeholder="Filtrar..." className={filterInput} />
              </th>
              <th className="px-4 py-1">
                <input value={colFilters.phone} onChange={(e) => setFilter('phone', e.target.value)} placeholder="Filtrar..." className={filterInput} />
              </th>
              <th className="px-4 py-1">
                <input value={colFilters.company} onChange={(e) => setFilter('company', e.target.value)} placeholder="Filtrar..." className={filterInput} />
              </th>
              <th className="px-4 py-1">
                <input value={colFilters.owner} onChange={(e) => setFilter('owner', e.target.value)} placeholder="Filtrar..." className={filterInput} />
              </th>
              <th className="px-4 py-1">
                <input value={colFilters.createdAt} onChange={(e) => setFilter('createdAt', e.target.value)} placeholder="dd/mm/aaaa" className={filterInput} />
              </th>
              <th className="px-4 py-1" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(client.id)}
                    onChange={() => toggleSelection(client.id)}
                    className="cursor-pointer"
                  />
                </td>
                <td
                  className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                  onClick={() => navigate(`/clientes/${client.id}`)}
                >
                  {client.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{client.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{client.phone || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{client.company || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{client.owner.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(client.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  <button onClick={() => openEdit(client)} className="text-gray-500 hover:text-blue-600">Editar</button>
                  <button onClick={() => setDeleteTarget(client)} className="text-gray-500 hover:text-red-600">Excluir</button>
                </td>
              </tr>
            ))}
            {displayedClients.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchClients(p)}
              className={`px-3 py-1 rounded text-sm ${p === pagination.page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editClient ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${deleteTarget?.name}"? Todos os negócios associados serão removidos em cascata. Esta ação não pode ser desfeita.`}
        loading={loading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Excluir Clientes"
        message={`Tem certeza que deseja excluir ${selectedIds.size} cliente(s)? Todos os negócios associados serão removidos em cascata. Esta ação não pode ser desfeita.`}
        loading={loading}
      />
    </div>
  );
}
