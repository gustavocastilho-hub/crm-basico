import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboard.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Summary {
  totalClients: number;
  openDeals: number;
  pipelineValue: number;
  pendingTasks: number;
}

interface SalesData {
  month: string;
  value: number;
}

interface FunnelData {
  stageId: string;
  label: string;
  type: 'OPEN' | 'WON' | 'LOST';
  count: number;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  user: { name: string };
  client?: { name: string } | null;
  deal?: { title: string } | null;
}

interface LeadsBySource {
  month: number;
  year: number;
  origins: { id: string; name: string }[];
  stages: { id: string; label: string; type: 'OPEN' | 'WON' | 'LOST' }[];
  matrix: Record<string, Record<string, number>>;
  totals: Record<string, number>;
  conversion: Record<string, number> | null;
  contractStageId: string | null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sales, setSales] = useState<SalesData[]>([]);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [leads, setLeads] = useState<LeadsBySource | null>(null);

  useEffect(() => {
    dashboardApi.summary().then(({ data }) => setSummary(data));
    dashboardApi.salesByMonth().then(({ data }) => setSales(data));
    dashboardApi.conversionFunnel().then(({ data }) => setFunnel(data));
    dashboardApi.recentActivities().then(({ data }) => setActivities(data));
  }, []);

  useEffect(() => {
    dashboardApi.leadsBySource(selectedYear, selectedMonth).then(({ data }) => setLeads(data));
  }, [selectedYear, selectedMonth]);

  const formatPercent = (v: number | null | undefined) =>
    v === null || v === undefined
      ? '—'
      : new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(v);

  const yearOptions = [today.getFullYear() - 2, today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Clientes', value: summary?.totalClients ?? '-', color: 'blue' },
          { label: 'Negócios Abertos', value: summary?.openDeals ?? '-', color: 'green' },
          { label: 'Valor no Pipeline', value: summary ? formatCurrency(summary.pipelineValue) : '-', color: 'purple' },
          { label: 'Tarefas Pendentes', value: summary?.pendingTasks ?? '-', color: 'orange' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 break-words">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Vendas por Mês</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Funil de Conversão</h2>
          <div className="space-y-3">
            {funnel.map((item) => {
              const maxCount = Math.max(...funnel.map((f) => f.count), 1);
              const width = (item.count / maxCount) * 100;
              return (
                <div key={item.stageId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leads por Fonte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Leads por Fonte</h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {!leads ? (
          <p className="text-gray-500 text-sm">Carregando…</p>
        ) : leads.origins.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma origem cadastrada. Cadastre origens em /origens.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Etapa / Métrica</th>
                  {leads.origins.map((o) => (
                    <th key={o.id} className="text-right py-2 px-4 font-medium text-gray-600">{o.name}</th>
                  ))}
                  <th className="text-right py-2 pl-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="py-2 pr-4 font-semibold">Total de Leads</td>
                  {leads.origins.map((o) => (
                    <td key={o.id} className="py-2 px-4 text-right font-semibold">{leads.totals[o.id] ?? 0}</td>
                  ))}
                  <td className="py-2 pl-4 text-right font-semibold">{leads.totals.__total ?? 0}</td>
                </tr>
                {leads.stages.map((stage) => (
                  <tr key={stage.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{stage.label}</td>
                    {leads.origins.map((o) => (
                      <td key={o.id} className="py-2 px-4 text-right">{leads.matrix[stage.id]?.[o.id] ?? 0}</td>
                    ))}
                    <td className="py-2 pl-4 text-right font-semibold">{leads.matrix[stage.id]?.__total ?? 0}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="py-2 pr-4 font-semibold">Taxa de Conversão</td>
                  {leads.origins.map((o) => (
                    <td key={o.id} className="py-2 px-4 text-right font-semibold">
                      {formatPercent(leads.conversion ? leads.conversion[o.id] : null)}
                    </td>
                  ))}
                  <td className="py-2 pl-4 text-right font-semibold">
                    {formatPercent(leads.conversion ? leads.conversion.__total : null)}
                  </td>
                </tr>
              </tbody>
            </table>
            {!leads.contractStageId && (
              <p className="text-xs text-gray-400 mt-2">
                Cadastre uma etapa com "Contrato" no nome para calcular a taxa de conversão.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Atividades Recentes</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma atividade ainda.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-medium">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    <span className="text-gray-600">{activity.content}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-1">
                    {activity.client && <span>Cliente: {activity.client.name}</span>}
                    {activity.deal && <span>Negócio: {activity.deal.title}</span>}
                    <span>{new Date(activity.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
