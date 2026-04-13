import { PrismaClient, DealStage } from '@prisma/client';
import { CreateDealInput, UpdateDealInput, MoveDealInput } from './deals.schema';

const prisma = new PrismaClient();

export async function listDeals(ownerFilter: any) {
  const deals = await prisma.deal.findMany({
    where: ownerFilter,
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: [{ stage: 'asc' }, { position: 'asc' }],
  });

  const stages: Record<string, typeof deals> = {
    LEAD: [],
    PROPOSTA: [],
    NEGOCIACAO: [],
    FECHADO_GANHO: [],
    FECHADO_PERDIDO: [],
  };

  for (const deal of deals) {
    stages[deal.stage].push(deal);
  }

  return stages;
}

export async function getDeal(id: string, ownerFilter: any) {
  const deal = await prisma.deal.findFirst({
    where: { id, ...ownerFilter },
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!deal) throw { status: 404, message: 'Negócio não encontrado' };
  return deal;
}

export async function createDeal(data: CreateDealInput, ownerId: string) {
  const maxPosition = await prisma.deal.aggregate({
    where: { stage: data.stage as DealStage },
    _max: { position: true },
  });

  return prisma.deal.create({
    data: {
      title: data.title,
      value: data.value,
      stage: data.stage as DealStage,
      position: (maxPosition._max.position ?? -1) + 1,
      clientId: data.clientId,
      ownerId,
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function updateDeal(id: string, data: UpdateDealInput, ownerFilter: any) {
  const existing = await prisma.deal.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Negócio não encontrado' };

  const updateData: any = { ...data };
  if (data.stage && ['FECHADO_GANHO', 'FECHADO_PERDIDO'].includes(data.stage)) {
    updateData.closedAt = new Date();
  }

  return prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function moveDeal(id: string, data: MoveDealInput, userId: string, ownerFilter: any) {
  const existing = await prisma.deal.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Negócio não encontrado' };

  const oldStage = existing.stage;
  const newStage = data.stage as DealStage;

  const updateData: any = {
    stage: newStage,
    position: data.position,
  };

  if (['FECHADO_GANHO', 'FECHADO_PERDIDO'].includes(newStage)) {
    updateData.closedAt = new Date();
  } else if (['FECHADO_GANHO', 'FECHADO_PERDIDO'].includes(oldStage) && !['FECHADO_GANHO', 'FECHADO_PERDIDO'].includes(newStage)) {
    updateData.closedAt = null;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (oldStage !== newStage) {
    await prisma.activity.create({
      data: {
        type: 'STAGE_CHANGE',
        content: `Movido de ${oldStage} para ${newStage}`,
        dealId: id,
        clientId: existing.clientId,
        userId,
      },
    });
  }

  return deal;
}

export async function deleteDeal(id: string, ownerFilter: any) {
  const existing = await prisma.deal.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Negócio não encontrado' };

  await prisma.deal.delete({ where: { id } });
}
