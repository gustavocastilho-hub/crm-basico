import { useEffect, useMemo, useRef, useState } from 'react';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FULL_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatBr = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: next.getMonth() === month });
    if (cells.length >= 42) break;
  }
  return cells;
}

export function DateRangePicker({ value, onChange, className, align = 'left' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(value.start);
  const [pendingEnd, setPendingEnd] = useState<string | null>(value.end);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => fromIso(value.start || toIso(new Date())).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => fromIso(value.start || toIso(new Date())).getMonth());
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const openPicker = () => {
    setPendingStart(value.start);
    setPendingEnd(value.end);
    setHoverDate(null);
    const d = fromIso(value.start || toIso(new Date()));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  };

  const nextMonth = useMemo(() => {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    return { y, m };
  }, [viewYear, viewMonth]);

  const navigate = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (iso: string) => {
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(iso);
      setPendingEnd(null);
      return;
    }
    if (iso < pendingStart) {
      setPendingEnd(pendingStart);
      setPendingStart(iso);
    } else {
      setPendingEnd(iso);
    }
  };

  const apply = () => {
    if (!pendingStart) return;
    const start = pendingStart;
    const end = pendingEnd ?? pendingStart;
    onChange({ start, end });
    setOpen(false);
  };

  const applyPreset = (preset: string) => {
    const t = new Date();
    let s: Date, e: Date;
    if (preset === 'today') { s = new Date(t); e = new Date(t); }
    else if (preset === 'yesterday') { s = new Date(t); s.setDate(t.getDate() - 1); e = new Date(s); }
    else if (preset === 'last-7') { e = new Date(t); s = new Date(t); s.setDate(t.getDate() - 6); }
    else if (preset === 'last-30') { e = new Date(t); s = new Date(t); s.setDate(t.getDate() - 29); }
    else if (preset === 'this-month') { s = new Date(t.getFullYear(), t.getMonth(), 1); e = new Date(t.getFullYear(), t.getMonth() + 1, 0); }
    else if (preset === 'last-month') { s = new Date(t.getFullYear(), t.getMonth() - 1, 1); e = new Date(t.getFullYear(), t.getMonth(), 0); }
    else if (preset === 'this-year') { s = new Date(t.getFullYear(), 0, 1); e = new Date(t.getFullYear(), 11, 31); }
    else { return; }
    setPendingStart(toIso(s));
    setPendingEnd(toIso(e));
    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
  };

  const renderMonth = (year: number, month: number) => {
    const cells = buildMonthGrid(year, month);
    return (
      <div className="select-none">
        <div className="text-center text-sm font-semibold text-gray-700 mb-2">
          {FULL_MONTHS[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-[10px] text-gray-400 mb-1">
          {WEEK_DAYS.map((d, i) => <div key={i} className="text-center py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, i) => {
            const iso = toIso(cell.date);
            const isStart = pendingStart && iso === pendingStart;
            const isEnd = pendingEnd && iso === pendingEnd;
            const rangeEnd = pendingEnd ?? hoverDate;
            const inRange =
              pendingStart && rangeEnd &&
              iso >= (pendingStart < rangeEnd ? pendingStart : rangeEnd) &&
              iso <= (pendingStart < rangeEnd ? rangeEnd : pendingStart);
            const isEndpoint = isStart || isEnd;
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => pendingStart && !pendingEnd ? setHoverDate(iso) : null}
                onClick={() => handleDayClick(iso)}
                className={`text-xs h-8 rounded-full transition-colors ${
                  !cell.inMonth ? 'text-gray-300' : 'text-gray-700'
                } ${
                  isEndpoint
                    ? 'bg-blue-600 text-white font-semibold'
                    : inRange
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const presets = [
    { k: 'today', label: 'Hoje' },
    { k: 'yesterday', label: 'Ontem' },
    { k: 'last-7', label: 'Últimos 7 dias' },
    { k: 'last-30', label: 'Últimos 30 dias' },
    { k: 'this-month', label: 'Este mês' },
    { k: 'last-month', label: 'Mês passado' },
    { k: 'this-year', label: 'Este ano' },
  ];

  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{value.start && value.end ? `${formatBr(value.start)} — ${formatBr(value.end)}` : 'Selecionar período'}</span>
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          ref={popRef}
          className={`absolute z-30 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col sm:flex-row min-w-[320px] sm:min-w-[640px]`}
        >
          <div className="border-b sm:border-b-0 sm:border-r border-gray-200 p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible flex-shrink-0">
            {presets.map((p) => (
              <button
                key={p.k}
                type="button"
                onClick={() => applyPreset(p.k)}
                className="px-3 py-1.5 text-xs text-left text-gray-600 hover:bg-gray-100 rounded whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-xs text-gray-500">
                {pendingStart ? formatBr(pendingStart) : '—'} → {pendingEnd ? formatBr(pendingEnd) : '—'}
              </div>
              <button type="button" onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderMonth(viewYear, viewMonth)}
              <div className="hidden sm:block">{renderMonth(nextMonth.y, nextMonth.m)}</div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="button" onClick={apply} disabled={!pendingStart} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function usePersistedDateRange(storageKey: string, defaultRange: DateRange) {
  const [range, setRange] = useState<DateRange>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.start && p.end) return p;
      }
    } catch {}
    return defaultRange;
  });
  const update = (r: DateRange) => {
    setRange(r);
    try {
      localStorage.setItem(storageKey, JSON.stringify(r));
    } catch {}
  };
  return [range, update] as const;
}

export const dateUtils = { toIso, fromIso, formatBr };
