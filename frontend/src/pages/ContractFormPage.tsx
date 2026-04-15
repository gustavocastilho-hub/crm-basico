import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contractFormsApi, ContractFormData } from '../api/contractForms.api';

type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'notfound' | 'error';

const initialForm: ContractFormData = {
  legalName: '',
  cnpj: '',
  address: '',
  cityState: '',
  cep: '',
  signerName: '',
  signerCpf: '',
  signerEmail: '',
  billingContact: '',
};

function maskCnpj(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskCpf(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCep(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function ContractFormPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [clientName, setClientName] = useState('');
  const [form, setForm] = useState<ContractFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('notfound');
      return;
    }
    contractFormsApi.getPublic(token)
      .then(({ data }) => {
        setClientName(data.clientName);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.response?.status === 404) setStatus('notfound');
        else setStatus('error');
      });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setStatus('submitting');
    setError(null);
    try {
      await contractFormsApi.submit(token, form);
      setStatus('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar formulário.');
      setStatus('ready');
    }
  };

  const setField = <K extends keyof ContractFormData>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Formulário indisponível</h1>
          <p className="text-gray-600 text-sm">
            Este link não está mais ativo. Entre em contato com o responsável para obter um novo.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Erro ao carregar</h1>
          <p className="text-gray-600 text-sm">Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Enviado com sucesso!</h1>
          <p className="text-gray-600 text-sm">
            Recebemos seus dados. Obrigado.
          </p>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
        <h1 className="text-xl font-semibold text-center mb-1 tracking-wide text-gray-800">DADOS CONTRATO</h1>
        {clientName && (
          <p className="text-center text-sm text-gray-500 mb-6">{clientName}</p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Razão Social <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.legalName} onChange={(e) => setField('legalName', e.target.value)} required />
          </div>

          <div>
            <label className={labelCls}>CNPJ <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.cnpj} onChange={(e) => setField('cnpj', maskCnpj(e.target.value))} required />
          </div>

          <div>
            <label className={labelCls}>Endereço <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.address} onChange={(e) => setField('address', e.target.value)} required />
          </div>

          <div>
            <label className={labelCls}>Cidade e Estado <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.cityState} onChange={(e) => setField('cityState', e.target.value)} required />
          </div>

          <div>
            <label className={labelCls}>CEP <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.cep} onChange={(e) => setField('cep', maskCep(e.target.value))} required />
          </div>

          <div>
            <label className={labelCls}>Nome completo da pessoa que irá assinar <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.signerName} onChange={(e) => setField('signerName', e.target.value)} required />
          </div>

          <div>
            <label className={labelCls}>CPF da pessoa <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.signerCpf} onChange={(e) => setField('signerCpf', maskCpf(e.target.value))} required />
          </div>

          <div>
            <label className={labelCls}>E-mail da pessoa <span className="text-red-500">*</span></label>
            <input type="email" className={inputCls} value={form.signerEmail} onChange={(e) => setField('signerEmail', e.target.value)} required />
          </div>

          <div>
            <label className={labelCls}>Whatsapp ou Email onde deseja que seja enviada a fatura mensalmente <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.billingContact} onChange={(e) => setField('billingContact', e.target.value)} required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 bg-[#0f4c4c] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
