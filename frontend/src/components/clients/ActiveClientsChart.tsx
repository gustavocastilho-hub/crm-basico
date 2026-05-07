import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ActivityStatPoint {
  month: string;
  activations: number;
  cancellations: number;
  cumulativeActive: number;
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-');
  return `${m}/${String(y).slice(2)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: ActivityStatPoint[];
}

export function ActiveClientsChart({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Line
          type="monotone"
          dataKey="cumulativeActive"
          name="Ativos acumulados"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="activations"
          name="Novas ativações"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="cancellations"
          name="Cancelamentos"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
