import { PrismaClient, Role, CommissionType, CommissionStatus } from '@prisma/client';
import { CreateBatchInput, UpdateCommissionInput, MarkPaidInput } from './commissions.schema';
import { getCommissionsConfig, resolveDefaultSdrUserId } from '../settings/settings.service';

const prisma = new PrismaClient();

const commissionInclude = {
  deal: {
    include: {
      client: { select: { id: true, name: true } },
      stage: { select: { id: true, label: true, type: true } },
      origin: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
  },
  user: { select: { id: true, name: true } },
} as const;

interface ListParams {
  startDate?: string;
  endDate?: string;
  referenceMonth?: string;
  status?: 'UNPAID' | 'PAID';
  userId: string;
  role: Role;
}

function parseDate(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function spDateString(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}


async function getContratoStage() {
  const stages = await prisma.stage.findMany();
  const contrato = stages.find((s) => s.label.toLowerCase() === 'contrato');
  return contrato ?? null;
}

export async function listCommissions(params: ListParams) {
  const where: any = {};

  if (params.role !== 'ADMIN') {
    where.userId = params.userId;
  }
  if (params.referenceMonth) where.referenceMonth = params.referenceMonth;
  if (params.status) where.status = params.status;

  if (params.startDate || params.endDate) {
    where.createdAt = {} as any;
    if (params.startDate) where.createdAt.gte = parseDate(params.startDate);
    if (params.endDate) {
      const end = parseDate(params.endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return prisma.commission.findMany({
    where,
    include: commissionInclude,
    orderBy: [{ referenceMonth: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function listEligibleDeals(referenceMonth?: string) {
  const contrato = await getContratoStage();
  if (!contrato) return [];

  const deals = await prisma.deal.findMany({
    where: {
      stage: { position: { gte: contrato.position }, type: { not: 'LOST' } },
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      stage: { select: { id: true, label: true, position: true } },
      origin: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  if (!referenceMonth) return deals;

  const taken = await prisma.commission.findMany({
    where: { referenceMonth },
    select: { dealId: true },
  });
  const takenSet = new Set(taken.map((t) => t.dealId));
  return deals.filter((d) => !takenSet.has(d.id));
}

function deriveType(originName?: string | null): CommissionType {
  if (!originName) return CommissionType.NON_SDR;
  return originName.trim().toUpperCase() === 'SDR' ? CommissionType.SDR : CommissionType.NON_SDR;
}

function calc(fee: number, percentage: number): number {
  return Number((fee * percentage / 100).toFixed(2));
}

export async function createBatch(input: CreateBatchInput) {
  const userId = await resolveDefaultSdrUserId();

  // Validar deals existem
  const dealIds = input.items.map((i) => i.dealId);
  const deals = await prisma.deal.findMany({ where: { id: { in: dealIds } } });
  if (deals.length !== dealIds.length) {
    throw { status: 400, message: 'Algum negócio não foi encontrado' };
  }

  // Conflitos
  const conflicts = await prisma.commission.findMany({
    where: { referenceMonth: input.referenceMonth, dealId: { in: dealIds } },
    select: { dealId: true },
  });
  if (conflicts.length) {
    throw {
      status: 409,
      message: `Já existe(m) ${conflicts.length} comissão(ões) para este mês de referência nos negócios selecionados`,
    };
  }

  const created = await prisma.$transaction(
    input.items.map((item) =>
      prisma.commission.create({
        data: {
          dealId: item.dealId,
          userId,
          referenceMonth: input.referenceMonth,
          type: item.type as CommissionType,
          implementationFee: item.implementationFee,
          percentage: item.percentage,
          calculatedAmount: calc(item.implementationFee, item.percentage),
          status: CommissionStatus.UNPAID,
          notes: input.notes ?? null,
        },
        include: commissionInclude,
      }),
    ),
  );

  return created;
}

export async function updateCommission(id: string, data: UpdateCommissionInput) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };

  const fee = data.implementationFee ?? Number(existing.implementationFee);
  const pct = data.percentage ?? Number(existing.percentage);
  const calculatedAmount = calc(fee, pct);

  return prisma.commission.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type as CommissionType } : {}),
      ...(data.implementationFee !== undefined ? { implementationFee: data.implementationFee } : {}),
      ...(data.percentage !== undefined ? { percentage: data.percentage } : {}),
      ...(data.paidAmount !== undefined ? { paidAmount: data.paidAmount } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      calculatedAmount,
    },
    include: commissionInclude,
  });
}

export async function deleteCommission(id: string) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };
  await prisma.commission.delete({ where: { id } });
}

export async function markPaid(id: string, data: MarkPaidInput) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };

  const paidAt = new Date(data.paidAt);
  if (isNaN(paidAt.getTime())) throw { status: 400, message: 'Data de pagamento inválida' };

  return prisma.commission.update({
    where: { id },
    data: {
      status: CommissionStatus.PAID,
      paidAt,
      ...(data.paidAmount !== undefined && data.paidAmount !== null
        ? { paidAmount: data.paidAmount }
        : {}),
    },
    include: commissionInclude,
  });
}

export async function markUnpaid(id: string) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };
  return prisma.commission.update({
    where: { id },
    data: { status: CommissionStatus.UNPAID, paidAt: null },
    include: commissionInclude,
  });
}

export async function estimate(referenceMonth: string) {
  const contrato = await getContratoStage();
  const config = await getCommissionsConfig();
  const planFeeMap = new Map(config.plans.map((p) => [p.planId, p.fee]));

  type EstimateItem = {
    status: 'ESTIMATED' | 'REGISTERED';
    commissionId?: string;
    deal: { id: string; title: string; client: { id: string; name: string } };
    plan: { id: string; name: string } | null;
    origin: { id: string; name: string } | null;
    type: 'SDR' | 'NON_SDR' | 'OTHER';
    implementationFee: number;
    percentage: number;
    calculatedAmount: number;
    contractExitedAt: Date | null;
  };

  const items: EstimateItem[] = [];
  if (!contrato) return { items, total: 0 };

  // Estimativa só faz sentido para meses futuros — no mês atual e em meses
  // passados, o card fica vazio.
  const currentMonth = spDateString(new Date()).slice(0, 7);
  if (referenceMonth <= currentMonth) return { items, total: 0 };

  // Comissões já registradas no mês selecionado, indexadas por dealId.
  const registered = await prisma.commission.findMany({
    where: { referenceMonth },
    include: commissionInclude,
  });
  const registeredByDeal = new Map(registered.map((r) => [r.dealId, r] as const));

  // Todos os deals na etapa Contrato ou à frente (excluindo Perdido).
  const deals = await prisma.deal.findMany({
    where: {
      stage: { position: { gte: contrato.position }, type: { not: 'LOST' } },
    },
    include: {
      client: { select: { id: true, name: true } },
      stage: { select: { id: true, label: true, position: true } },
      origin: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
    orderBy: [{ contractExitedAt: 'asc' }, { updatedAt: 'asc' }],
  });

  for (const d of deals) {
    const reg = registeredByDeal.get(d.id);
    if (reg) {
      items.push({
        status: 'REGISTERED',
        commissionId: reg.id,
        deal: { id: d.id, title: d.title, client: d.client },
        plan: d.plan,
        origin: d.origin,
        type: reg.type,
        implementationFee: Number(reg.implementationFee),
        percentage: Number(reg.percentage),
        calculatedAmount: Number(reg.calculatedAmount),
        contractExitedAt: d.contractExitedAt,
      });
    } else {
      const planId = d.plan?.id ?? null;
      const fee = planId ? planFeeMap.get(planId) ?? 0 : 0;
      const type = deriveType(d.origin?.name);
      const pct = type === 'SDR' ? config.percentages.SDR : config.percentages.NON_SDR;
      items.push({
        status: 'ESTIMATED',
        deal: { id: d.id, title: d.title, client: d.client },
        plan: d.plan,
        origin: d.origin,
        type,
        implementationFee: fee,
        percentage: pct,
        calculatedAmount: calc(fee, pct),
        contractExitedAt: d.contractExitedAt,
      });
    }
  }

  const total = items.reduce((s, i) => s + i.calculatedAmount, 0);
  return { items, total };
}
