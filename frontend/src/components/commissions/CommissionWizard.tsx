import { useEffect, useMemo, useState } from 'react';
import {
  commissionsApi,
  EligibleDeal,
  CommissionType,
  BatchItem,
} from '../../api/commissions.api';
import { settingsApi, CommissionsConfig } from '../../api/settings.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

type Plan = 'START' | 'PLENO' | 'OTHER';

interface Row {
  dealId: string;
  dealTitle: string;
  clientName: string;
  originName: string | null;
  planChoice: Plan;
  planMatchedId: string | null;
  implementationFee: number;
  type: CommissionType;
  percentage: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CommissionWizard({ open, onClose, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [referenceMonth, setReferenceMonth] = useState(currentMonth());
  const [deals, setDeals] = useState<EligibleDeal[]>([]);
  const [config, setConfig] = useState<CommissionsConfig | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelected(new Set());
    setRows([]);
    setNotes('');
    setError('');
    setSearch('');
  }, [open]);

  const fetchDeals = async () => {
    setLoading(true);
    setError('');
    try {
      const [dealsRes, cfgRes] = await Promise.all([
        commissionsApi.eligibleDeals(referenceMonth),
        settingsApi.getCommissions(),
      ]);
      setDeals(dealsRes.data);
      setConfig(cfgRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao carregar negócios');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, referenceMonth]);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.client.name.toLowerCase().includes(q) ||
        (d.origin?.name ?? '').toLowerCase().includes(q) ||
        (d.plan?.name ?? '').toLowerCase().includes(q),
    );
  }, [deals, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filteredDeals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredDeals.map((d) => d.id)));
    }
  };

  const buildRowsFromSelection = (): Row[] => {
    if (!config) return [];
    const planFeeByName = new Map<string, { id: string; fee: number }>();
    for (const p of config.plans) {
      planFeeByName.set(p.planName.trim().toUpperCase(), { id: p.planId, fee: p.fee });
    }

    return Array.from(selected).map((id) => {
      const d = deals.find((x) => x.id === id)!;
      const planUpper = (d.plan?.name ?? '').trim().toUpperCase();
      let planChoice: Plan = 'OTHER';
      let fee = 0;
      let planMatchedId: string | null = null;
      if (planUpper === 'START' && planFeeByName.has('START')) {
        planChoice = 'START';
        fee = planFeeByName.get('START')!.fee;
        planMatchedId = planFeeByName.get('START')!.id;
      } else if (planUpper === 'PLENO' && planFeeByName.has('PLENO')) {
        planChoice = 'PLENO';
        fee = planFeeByName.get('PLENO')!.fee;
        planMatchedId = planFeeByName.get('PLENO')!.id;
      }

      const isSdr = (d.origin?.name ?? '').trim().toUpperCase() === 'SDR';
      const type: CommissionType = isSdr ? 'SDR' : 'NON_SDR';
      const percentage = isSdr ? config.percentages.SDR : config.percentages.NON_SDR;

      return {
        dealId: d.id,
        dealTitle: d.title,
        clientName: d.client.name,
        originName: d.origin?.name ?? null,
        planChoice,
        planMatchedId,
        implementationFee: fee,
        type,
        percentage,
      };
    });
  };

  const goNext = () => {
    if (selected.size === 0) return;
    setRows(buildRowsFromSelection());
    setStep(2);
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const onPlanChange = (idx: number, plan: Plan) => {
    if (!config) return;
    const planFeeByName = new Map<string, { id: string; fee: number }>();
    for (const p of config.plans) {
      planFeeByName.set(p.planName.trim().toUpperCase(), { id: p.planId, fee: p.fee });
    }
    if (plan === 'START' && planFeeByName.has('START')) {
      const m = planFeeByName.get('START')!;
      updateRow(idx, { planChoice: plan, implementationFee: m.fee, planMatchedId: m.id });
    } else if (plan === 'PLENO' && planFeeByName.has('PLENO')) {
      const m = planFeeByName.get('PLENO')!;
      updateRow(idx, { planChoice: plan, implementationFee: m.fee, planMatchedId: m.id });
    } else {
      updateRow(idx, { planChoice: 'OTHER', planMatchedId: null });
    }
  };

  const onTypeChange = (idx: number, type: CommissionType) => {
    if (!config) return;
    if (type === 'SDR') updateRow(idx, { type, percentage: config.percentages.SDR });
    else if (type === 'NON_SDR') updateRow(idx, { type, percentage: config.percentages.NON_SDR });
    else updateRow(idx, { type: 'OTHER' });
  };

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + r.implementationFee * (r.percentage / 100), 0),
    [rows],
  );

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const items: BatchItem[] = rows.map((r) => ({
        dealId: r.dealId,
        type: r.type,
        implementationFee: Number(r.implementationFee) || 0,
        percentage: Number(r.percentage) || 0,
      }));
      await commissionsApi.createBatch({
        referenceMonth,
        notes: notes.trim() || null,
        items,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao registrar comissões');
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-stretch sm:items-center justify-center" style={{ zIndex: 60 }}>
      <div className="bg-white w-full sm:max-w-5xl sm:mx-4 sm:rounded-xl shadow-xl max-h-[100dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Nova comissão do mês</h2>
            <p className="text-xs text-gray-500">Passo {step} de 2 — {step === 1 ? 'Selecione os negócios' : 'Configure as comissões'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2" aria-label="Fechar">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mês de referência</label>
                  <input
                    type="month"
                    value={referenceMonth}
                    onChange={(e) => setReferenceMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Buscar</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, cliente, origem..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Mostrando deals na etapa <strong>Contrato</strong> ou à frente (excluindo Perdido).
              </div>

              {loading && <p className="text-sm text-gray-500">Carregando…</p>}
              {!loading && filteredDeals.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum negócio elegível neste mês.</p>
              )}

              {!loading && filteredDeals.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="text-sm min-w-[720px] w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 w-8">
                          <input
                            type="checkbox"
                            checked={selected.size === filteredDeals.length && filteredDeals.length > 0}
                            onChange={toggleAll}
                          />
                        </th>
                        <th className="text-left px-2 py-2">Negócio</th>
                        <th className="text-left px-2 py-2">Cliente</th>
                        <th className="text-left px-2 py-2">Etapa</th>
                        <th className="text-left px-2 py-2">Origem</th>
                        <th className="text-left px-2 py-2">Plano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((d, i) => (
                        <tr key={d.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selected.has(d.id)}
                              onChange={() => toggleSelect(d.id)}
                            />
                          </td>
                          <td className="px-2 py-2">{d.title}</td>
                          <td className="px-2 py-2">{d.client.name}</td>
                          <td className="px-2 py-2">{d.stage.label}</td>
                          <td className="px-2 py-2">{d.origin?.name ?? '—'}</td>
                          <td className="px-2 py-2">{d.plan?.name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="text-xs text-gray-600">Mês de referência: <strong>{referenceMonth}</strong> · {rows.length} negócio(s)</div>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-2 py-2">Negócio</th>
                      <th className="text-left px-2 py-2">Plano</th>
                      <th className="text-left px-2 py-2">Taxa implementação</th>
                      <th className="text-left px-2 py-2">Tipo comissão</th>
                      <th className="text-left px-2 py-2">% comissão</th>
                      <th className="text-right px-2 py-2">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const valor = (Number(r.implementationFee) || 0) * ((Number(r.percentage) || 0) / 100);
                      return (
                        <tr key={r.dealId} className={idx % 2 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-2 py-2">
                            <div className="font-medium">{r.dealTitle}</div>
                            <div className="text-xs text-gray-500">{r.clientName}</div>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={r.planChoice}
                              onChange={(e) => onPlanChange(idx, e.target.value as Plan)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="START">Start</option>
                              <option value="PLENO">Pleno</option>
                              <option value="OTHER">Outro</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              readOnly={r.planChoice !== 'OTHER'}
                              value={r.implementationFee}
                              onChange={(e) => updateRow(idx, { implementationFee: parseFloat(e.target.value) || 0 })}
                              className={`w-32 px-2 py-1 border border-gray-300 rounded text-sm ${r.planChoice !== 'OTHER' ? 'bg-gray-50' : ''}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={r.type}
                              onChange={(e) => onTypeChange(idx, e.target.value as CommissionType)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="SDR">SDR</option>
                              <option value="NON_SDR">Não-SDR</option>
                              <option value="OTHER">Outro</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              readOnly={r.type !== 'OTHER'}
                              value={r.percentage}
                              onChange={(e) => updateRow(idx, { percentage: parseFloat(e.target.value) || 0 })}
                              className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm ${r.type !== 'OTHER' ? 'bg-gray-50' : ''}`}
                            />
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap">{formatCurrency(valor)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50 font-bold">
                      <td colSpan={5} className="px-2 py-3 text-right">Total</td>
                      <td className="px-2 py-3 text-right text-base">{formatCurrency(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Notas (aplicadas a todas)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-200 bg-white">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <div className="text-xs text-gray-500">{selected.size} selecionado(s)</div>
              <button
                onClick={goNext}
                disabled={selected.size === 0 || !config}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Próximo →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">← Anterior</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Registrando…' : 'Confirmar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
