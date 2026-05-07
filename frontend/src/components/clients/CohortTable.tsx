export interface CohortRow {
  cohortMonth: string;
  size: number;
  retention: { offset: number; month: string; count: number; pct: number }[];
}

function pctColor(pct: number): string {
  if (pct >= 90) return '#059669';
  if (pct >= 75) return '#10b981';
  if (pct >= 60) return '#34d399';
  if (pct >= 45) return '#fbbf24';
  if (pct >= 30) return '#f97316';
  return '#ef4444';
}

function formatMonth(key: string) {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[Number(m) - 1]}/${String(y).slice(2)}`;
}

interface Props {
  data: CohortRow[];
}

export function CohortTable({ data }: Props) {
  const nonEmpty = data.filter((r) => r.size > 0);
  if (nonEmpty.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Sem dados de coorte para o período selecionado.</p>;
  }

  const maxOffset = Math.max(...nonEmpty.map((r) => r.retention.length - 1), 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-gray-500 font-medium whitespace-nowrap">Coorte</th>
            <th className="text-right py-2 px-3 text-gray-500 font-medium whitespace-nowrap">Clientes</th>
            {Array.from({ length: maxOffset + 1 }, (_, i) => (
              <th key={i} className="text-center py-2 px-2 text-gray-500 font-medium whitespace-nowrap min-w-[52px]">
                M+{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nonEmpty.map((row) => (
            <tr key={row.cohortMonth} className="border-t border-gray-100">
              <td className="py-2 px-3 text-gray-700 font-medium whitespace-nowrap">{formatMonth(row.cohortMonth)}</td>
              <td className="py-2 px-3 text-right text-gray-500 whitespace-nowrap">{row.size}</td>
              {Array.from({ length: maxOffset + 1 }, (_, offset) => {
                const cell = row.retention.find((r) => r.offset === offset);
                if (!cell) return <td key={offset} className="py-2 px-2" />;
                return (
                  <td key={offset} className="py-2 px-2 text-center">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 font-medium text-white"
                      style={{ background: pctColor(cell.pct), minWidth: 40 }}
                      title={`${cell.count} cliente${cell.count !== 1 ? 's' : ''}`}
                    >
                      {cell.pct}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 mt-2 px-3">
        M+0 = mês de ativação. Percentual de clientes ainda ativos em cada mês subsequente.
      </p>
    </div>
  );
}
