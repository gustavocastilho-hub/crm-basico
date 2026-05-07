import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi } from '../api/clients.api';
import { DateRangePicker, usePersistedDateRange, dateUtils } from '../components/ui/DateRangePicker';
import { ActiveClientsChart, ActivityStatPoint } from '../components/clients/ActiveClientsChart';
import { CohortTable, CohortRow } from '../components/clients/CohortTable';

interface ActiveClient {
  id: string;
  name: string;
  company: string | null;
  status: 'PROSPECT' | 'ACTIVE' | 'CANCELLED';
  activatedAt: string | null;
  cancelledAt: string | null;
}

const statusLabel: Record<string, string> = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Ativo',
  CANCELLED: 'Cancelado',
};
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PROSPECT: 'bg-gray-100 text-gray-600',
};

function defaultRange() {
  const today = new Date();
  const start = new Date(today.getFullYear() - 1, today.getMonth() + 1, 1);
  return {
    start: dateUtils.toIso(start),
    end: dateUtils.toIso(today),
  };
}

export function ClientsActivityPage() {
  const [range, setRange] = usePersistedDateRange('clients.activityRange', defaultRange());
  const [stats, setStats] = useState<ActivityStatPoint[]>([]);
  const [activeClients, setActiveClients] = useState<ActiveClient[]>([]);
  const [cohort, setCohort] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      clientsApi.activityStats(range.start, range.end),
      clientsApi.activeList(range.start, range.end),
      clientsApi.cohortStats(range.start, range.end),
    ])
      .then(([s, a, c]) => {
        setStats(s.data);
        setActiveClients(a.data);
        setCohort(c.data);
      })
      .finally(() => setLoading(false));
  }, [range.start, range.end]);

  const totalActiveNow = stats.length > 0 ? stats[stats.length - 1].cumulativeActive : 0;
  const totalActivations = stats.reduce((s, d) => s + d.activations, 0);
  const totalCancellations = stats.reduce((s, d) => s + d.cancellations, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes Ativos</h1>
          <p className="text-sm text-gray-500">Ativações, cancelamentos e análise de retenção</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} align="right" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Ativos no fim do período</p>
          <p className="text-2xl font-bold text-green-600">{totalActiveNow}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Ativações no período</p>
          <p className="text-2xl font-bold text-blue-600">{totalActivations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cancelamentos no período</p>
          <p className="text-2xl font-bold text-red-500">{totalCancellations}</p>
        </div>
      </div>

      {/* Gráfico de linha */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Evolução de clientes</h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <ActiveClientsChart data={stats} />
        )}
      </div>

      {/* Tabela de clientes ativos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Clientes ativados no período
          <span className="ml-2 text-xs font-normal text-gray-400">({activeClients.length})</span>
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : activeClients.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente ativado neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Empresa</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Ativado em</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Cancelado em</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Dias ativo</th>
                </tr>
              </thead>
              <tbody>
                {activeClients.map((c) => {
                  const activated = c.activatedAt ? new Date(c.activatedAt) : null;
                  const cancelled = c.cancelledAt ? new Date(c.cancelledAt) : null;
                  const daysActive = activated
                    ? Math.floor(((cancelled ?? new Date()).getTime() - activated.getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <Link to={`/clientes/${c.id}`} className="text-blue-600 hover:underline font-medium">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{c.company || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600">
                        {activated ? activated.toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600">
                        {cancelled ? cancelled.toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600">
                        {daysActive !== null ? daysActive : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabela de coorte */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Retenção por coorte</h2>
        <p className="text-xs text-gray-400 mb-4">Clientes agrupados pelo mês de ativação. Percentual ainda ativo nos meses seguintes.</p>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <CohortTable data={cohort} />
        )}
      </div>
    </div>
  );
}
