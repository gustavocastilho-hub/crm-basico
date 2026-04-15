import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/clients.api';
import { contractFormsApi, ContractSubmission } from '../api/contractForms.api';
import { useAuthStore } from '../store/authStore';

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  formToken: string | null;
  owner: { id: string; name: string };
  _count: { deals: number; tasks: number };
  createdAt: string;
}

interface Activity {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

const typeLabels: Record<string, string> = {
  NOTE: 'Nota',
  CALL: 'Ligação',
  EMAIL: 'Email',
  MEETING: 'Reunião',
  STAGE_CHANGE: 'Mudança de Etapa',
  CONTRACT_FORM_SUBMITTED: 'Formulário de contrato',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 break-words">{value}</p>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityForm, setActivityForm] = useState({ type: 'NOTE', content: '' });
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<ContractSubmission[]>([]);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    clientsApi.get(id).then(({ data }) => setClient(data));
    clientsApi.getActivities(id).then(({ data }) => setActivities(data));
  }, [id]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    contractFormsApi.listSubmissions(id).then(({ data }) => setSubmissions(data));
  }, [id, isAdmin]);

  const formUrl = client?.formToken
    ? `${window.location.origin}/formulario-contrato/${client.formToken}`
    : null;

  const handleGenerateToken = async () => {
    if (!id) return;
    setTokenLoading(true);
    try {
      const { data } = await contractFormsApi.generateToken(id);
      setClient((prev) => (prev ? { ...prev, formToken: data.token } : prev));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!id) return;
    if (!confirm('Revogar o link? Ele deixará de funcionar imediatamente.')) return;
    setTokenLoading(true);
    try {
      await contractFormsApi.revokeToken(id);
      setClient((prev) => (prev ? { ...prev, formToken: null } : prev));
    } finally {
      setTokenLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!formUrl) return;
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !activityForm.content.trim()) return;
    setLoading(true);
    try {
      const { data } = await clientsApi.addActivity(id, activityForm);
      setActivities([data, ...activities]);
      setActivityForm({ type: 'NOTE', content: '' });
    } catch {}
    setLoading(false);
  };

  if (!client) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clientes')} className="text-sm text-blue-600 hover:underline">&larr; Voltar para clientes</button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.company && <p className="text-gray-500">{client.company}</p>}
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-blue-50 rounded-lg px-4 py-2">
              <p className="text-xl font-bold text-blue-600">{client._count.deals}</p>
              <p className="text-xs text-gray-500">Negócios</p>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-2">
              <p className="text-xl font-bold text-green-600">{client._count.tasks}</p>
              <p className="text-xs text-gray-500">Tarefas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Telefone</p>
            <p className="text-sm">{client.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Responsável</p>
            <p className="text-sm">{client.owner.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Criado em</p>
            <p className="text-sm">{new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        {client.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Notas</p>
            <p className="text-sm text-gray-700">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Add Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Adicionar Atividade</h2>
        <form onSubmit={addActivity} className="flex gap-3">
          <select
            value={activityForm.type}
            onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="NOTE">Nota</option>
            <option value="CALL">Ligação</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Reunião</option>
          </select>
          <input
            value={activityForm.content}
            onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
            placeholder="Descreva a atividade..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Formulário de contrato</h2>
          {client.formToken ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Link público para envio ao cliente:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={formUrl || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={handleRevokeToken}
                  disabled={tokenLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                >
                  Revogar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Ainda não há um link ativo para este cliente.</p>
              <button
                onClick={handleGenerateToken}
                disabled={tokenLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {tokenLoading ? 'Gerando...' : 'Gerar link'}
              </button>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Respostas do formulário</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma resposta recebida.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => {
                const isOpen = expandedSubmission === s.id;
                return (
                  <div key={s.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedSubmission(isOpen ? null : s.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.legalName}</p>
                        <p className="text-xs text-gray-500">
                          Enviado em {new Date(s.submittedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3">
                        <Field label="Razão Social" value={s.legalName} />
                        <Field label="CNPJ" value={s.cnpj} />
                        <Field label="Endereço" value={s.address} />
                        <Field label="Cidade e Estado" value={s.cityState} />
                        <Field label="CEP" value={s.cep} />
                        <Field label="Nome do signatário" value={s.signerName} />
                        <Field label="CPF" value={s.signerCpf} />
                        <Field label="Email do signatário" value={s.signerEmail} />
                        <Field label="Contato para fatura" value={s.billingContact} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Activities Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-medium">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    {' - '}
                    <span className="text-gray-500">{typeLabels[activity.type] || activity.type}</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{activity.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
