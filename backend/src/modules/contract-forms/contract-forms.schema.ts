import { z } from 'zod';

export const submitContractFormSchema = z.object({
  legalName: z.string().min(1, 'Razão Social é obrigatória'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  cityState: z.string().min(1, 'Cidade e Estado são obrigatórios'),
  cep: z.string().min(1, 'CEP é obrigatório'),
  signerName: z.string().min(1, 'Nome do signatário é obrigatório'),
  signerCpf: z.string().min(1, 'CPF é obrigatório'),
  signerEmail: z.string().email('Email inválido'),
  billingContact: z.string().min(1, 'Contato para fatura é obrigatório'),
});

export type SubmitContractFormInput = z.infer<typeof submitContractFormSchema>;
