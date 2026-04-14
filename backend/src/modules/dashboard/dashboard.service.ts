import { PrismaClient, StageType } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSummary(ownerFilter: any) {
  const [totalClients, openDeals, pipelineValue, pendingTasks] = await Promise.all([
    prisma.client.count({ where: ownerFilter }),
    prisma.deal.count({
      where: {
        ...ownerFilter,
        stage: { type: StageType.OPEN },
      },
    }),
    prisma.deal.aggregate({
      where: {
        ...ownerFilter,
        stage: { type: StageType.OPEN },
      },
      _sum: { value: true },
    }),
    prisma.task.count({
      where: { ...ownerFilter, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
    }),
  ]);

  return {
    totalClients,
    openDeals,
    pipelineValue: pipelineValue._sum.value || 0,
    pendingTasks,
  };
}

export async function getSalesByMonth(ownerFilter: any) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const deals = await prisma.deal.findMany({
    where: {
      ...ownerFilter,
      stage: { type: StageType.WON },
      closedAt: { gte: twelveMonthsAgo },
    },
    select: { value: true, closedAt: true },
  });

  const monthlyData: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  for (const deal of deals) {
    if (deal.closedAt && deal.value) {
      const key = `${deal.closedAt.getFullYear()}-${String(deal.closedAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += Number(deal.value);
      }
    }
  }

  return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
}

export async function getConversionFunnel(ownerFilter: any) {
  const stages = await prisma.stage.findMany({ orderBy: { position: 'asc' } });

  const counts = await Promise.all(
    stages.map(async (stage) => ({
      stageId: stage.id,
      label: stage.label,
      type: stage.type,
      count: await prisma.deal.count({ where: { ...ownerFilter, stageId: stage.id } }),
    }))
  );

  return counts;
}

export async function getRecentActivities(ownerFilter: any) {
  const userFilter = ownerFilter.ownerId ? { userId: ownerFilter.ownerId } : {};

  return prisma.activity.findMany({
    where: userFilter,
    include: {
      user: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
