import { PrismaClient, Role } from '@prisma/client';
import { CreateCommissionInput, UpdateCommissionInput } from './commissions.schema';

const prisma = new PrismaClient();

interface ListParams {
  startDate?: string;
  endDate?: string;
  userId: string;
  role: Role;
}

function parseDate(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function listCommissions(params: ListParams) {
  const where: any = {};

  if (params.role !== 'ADMIN') {
    where.userId = params.userId;
  }

  if (params.startDate || params.endDate) {
    where.deal = {
      closedAt: {} as any,
    };
    if (params.startDate) where.deal.closedAt.gte = parseDate(params.startDate);
    if (params.endDate) {
      const end = parseDate(params.endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.deal.closedAt.lte = end;
    }
  }

  return prisma.commission.findMany({
    where,
    include: {
      deal: {
        include: {
          client: { select: { id: true, name: true } },
          stage: { select: { id: true, label: true, type: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listEligibleDeals() {
  // Deals em etapas WON (vendas ganhas)
  return prisma.deal.findMany({
    where: {
      stage: { type: 'WON' },
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      stage: { select: { id: true, label: true } },
    },
    orderBy: { closedAt: 'desc' },
  });
}

export async function createCommission(data: CreateCommissionInput) {
  const deal = await prisma.deal.findUnique({ where: { id: data.dealId } });
  if (!deal) throw { status: 404, message: 'Negócio não encontrado' };

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw { status: 404, message: 'Vendedor não encontrado' };

  const existing = await prisma.commission.findUnique({
    where: { dealId_userId: { dealId: data.dealId, userId: data.userId } },
  });
  if (existing) throw { status: 409, message: 'Comissão já existe para este vendedor neste negócio' };

  return prisma.commission.create({
    data: {
      dealId: data.dealId,
      userId: data.userId,
      percentage: data.percentage,
      notes: data.notes ?? null,
    },
    include: {
      deal: {
        include: {
          client: { select: { id: true, name: true } },
          stage: { select: { id: true, label: true, type: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });
}

export async function updateCommission(id: string, data: UpdateCommissionInput) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };

  return prisma.commission.update({
    where: { id },
    data: {
      ...(data.percentage !== undefined ? { percentage: data.percentage } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
    },
    include: {
      deal: {
        include: {
          client: { select: { id: true, name: true } },
          stage: { select: { id: true, label: true, type: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });
}

export async function deleteCommission(id: string) {
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Comissão não encontrada' };
  await prisma.commission.delete({ where: { id } });
}
