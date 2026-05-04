export const VERSION = '0.5.0';

export interface VersionEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '0.5.0',
    date: '2026-05-04',
    changes: [
      'Nova aba: Ligações/Mensagens SDR com tabela ordenável, filtros por coluna e período persistente',
      'Nova aba: Comissões para vendedores (admin define negócio + vendedor + %)',
      'Nova aba: Pedidos de Melhorias com bulk selection (excluir/marcar implementado)',
      'Novo seletor de data tipo Google: calendário único com presets e botão Aplicar',
      'Seletores de período agora persistem entre sessões (localStorage)',
      'Sidebar com botão para recolher/expandir',
      'Página Configurações exibe versão e histórico de mudanças',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-04-28',
    changes: [
      'Dashboard: tabela "Leads por Fonte" com seletor de período e novos clientes',
      'Dashboard: split em duas tabelas (etapas + métricas) com melhorias mobile',
      'Picker de range em popup único ao lado do título',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-04-22',
    changes: [
      'Etapas do pipeline migradas para o banco com tipos OPEN/WON/LOST',
      'Nichos, planos e estágios de contrato',
      'Onboarding com upload no Google Drive',
    ],
  },
];
