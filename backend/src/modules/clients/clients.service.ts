import crypto from 'crypto';
import { PrismaClient, ContractStage } from '@prisma/client';
import { CreateClientInput, UpdateClientInput, AddActivityInput } from './clients.schema';

function generateMonths(from: string, to: string) {
  const result: { key: string; start: Date; end: Date }[] = [];
  const fromDate = new Date(from);
  const toDate = new Date(to);
  let current = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  while (current <= toDate) {
    const y = current.getFullYear();
    const m = current.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    result.push({ key, start, end });
    current = new Date(y, m + 1, 1);
  }
  return result;
}
import { advanceContractStageForClient } from '../deals/deals.service';

const prisma = new PrismaClient();

function buildFormUrl(token: string) {
  const base = process.env.PUBLIC_APP_URL || '';
  return base ? `${base}/formulario-contrato/${token}` : `/formulario-contrato/${token}`;
}

export async function listClients(
  ownerFilter: any,
  search: string | undefined,
  page: number,
  limit: number,
  skip: number
) {
  const where: any = {
    ...ownerFilter,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

export async function getClient(id: string, ownerFilter: any) {
  const client = await prisma.client.findFirst({
    where: { id, ...ownerFilter },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { deals: true, tasks: true } },
    },
  });

  if (!client) throw { status: 404, message: 'Cliente não encontrado' };
  return client;
}

export async function createClient(data: CreateClientInput, ownerId: string) {
  return prisma.client.create({
    data: { ...data, email: data.email || null, ownerId },
    include: { owner: { select: { id: true, name: true } } },
  });
}

export async function updateClient(id: string, data: UpdateClientInput, ownerFilter: any) {
  const existing = await prisma.client.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Cliente não encontrado' };

  const { activatedAt, cancelledAt, status, ...rest } = data as any;
  const updateData: any = { ...rest, email: rest.email ?? existing.email };
  if (status !== undefined) updateData.status = status;
  if (activatedAt !== undefined) updateData.activatedAt = activatedAt ? new Date(activatedAt) : null;
  if (cancelledAt !== undefined) updateData.cancelledAt = cancelledAt ? new Date(cancelledAt) : null;

  return prisma.client.update({
    where: { id },
    data: updateData,
    include: { owner: { select: { id: true, name: true } } },
  });
}

export async function deleteClient(id: string, ownerFilter: any) {
  const existing = await prisma.client.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Cliente não encontrado' };

  await prisma.client.delete({ where: { id } });
}

export async function bulkDeleteClients(ids: string[], ownerFilter: any) {
  const result = await prisma.client.deleteMany({
    where: { id: { in: ids }, ...ownerFilter },
  });
  return { count: result.count };
}

export async function getClientActivities(id: string, ownerFilter: any) {
  const client = await prisma.client.findFirst({ where: { id, ...ownerFilter } });
  if (!client) throw { status: 404, message: 'Cliente não encontrado' };

  return prisma.activity.findMany({
    where: { clientId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function addClientActivity(id: string, data: AddActivityInput, userId: string, ownerFilter: any) {
  const client = await prisma.client.findFirst({ where: { id, ...ownerFilter } });
  if (!client) throw { status: 404, message: 'Cliente não encontrado' };

  return prisma.activity.create({
    data: { ...data, clientId: id, userId },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function generateFormToken(id: string) {
  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, formToken: true } });
  if (!client) throw { status: 404, message: 'Cliente não encontrado' };

  if (client.formToken) {
    return { token: client.formToken, url: buildFormUrl(client.formToken) };
  }

  const token = crypto.randomBytes(24).toString('base64url');
  await prisma.client.update({ where: { id }, data: { formToken: token } });
  await advanceContractStageForClient(id, [ContractStage.NOT_GENERATED], ContractStage.LINK_SENT);
  return { token, url: buildFormUrl(token) };
}

export async function revokeFormToken(id: string) {
  const client = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!client) throw { status: 404, message: 'Cliente não encontrado' };

  await prisma.client.update({ where: { id }, data: { formToken: null } });
}

export async function listContractSubmissions(id: string) {
  const client = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!client) throw { status: 404, message: 'Cliente não encontrado' };

  return prisma.contractSubmission.findMany({
    where: { clientId: id },
    orderBy: { submittedAt: 'desc' },
  });
}

export async function deleteContractSubmission(clientId: string, submissionId: string) {
  const submission = await prisma.contractSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, clientId: true },
  });
  if (!submission || submission.clientId !== clientId) {
    throw { status: 404, message: 'Resposta não encontrada' };
  }
  await prisma.contractSubmission.delete({ where: { id: submissionId } });
}

export async function getActivityStats(from: string, to: string) {
  const allClients = await prisma.client.findMany({
    where: { OR: [{ activatedAt: { not: null } }, { cancelledAt: { not: null } }] },
    select: { activatedAt: true, cancelledAt: true },
  });

  return generateMonths(from, to).map(({ key, start, end }) => {
    const activations = allClients.filter(
      (c) => c.activatedAt && c.activatedAt >= start && c.activatedAt <= end
    ).length;
    const cancellations = allClients.filter(
      (c) => c.cancelledAt && c.cancelledAt >= start && c.cancelledAt <= end
    ).length;
    const cumulativeActive = allClients.filter(
      (c) => c.activatedAt && c.activatedAt <= end && (!c.cancelledAt || c.cancelledAt > end)
    ).length;
    return { month: key, activations, cancellations, cumulativeActive };
  });
}

export async function getActiveClientsList(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to + 'T23:59:59.999Z');
  return prisma.client.findMany({
    where: {
      activatedAt: { gte: fromDate, lte: toDate },
    },
    select: {
      id: true,
      name: true,
      company: true,
      status: true,
      activatedAt: true,
      cancelledAt: true,
    },
    orderBy: { activatedAt: 'asc' },
  });
}

export async function getCohortStats(from: string, to: string) {
  const allClients = await prisma.client.findMany({
    where: { activatedAt: { not: null } },
    select: { activatedAt: true, cancelledAt: true },
  });

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return generateMonths(from, to).map(({ key: cohortKey, start: cohortStart, end: cohortEnd }) => {
    const cohortClients = allClients.filter(
      (c) => c.activatedAt && c.activatedAt >= cohortStart && c.activatedAt <= cohortEnd
    );
    const size = cohortClients.length;
    if (size === 0) return { cohortMonth: cohortKey, size: 0, retention: [] };

    const retention: { offset: number; month: string; count: number; pct: number }[] = [];
    let offset = 0;
    let obsStart = new Date(cohortEnd.getFullYear(), cohortEnd.getMonth(), 1);

    while (obsStart <= today) {
      const obsEnd = new Date(obsStart.getFullYear(), obsStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const obsKey = `${obsStart.getFullYear()}-${String(obsStart.getMonth() + 1).padStart(2, '0')}`;
      const count = cohortClients.filter(
        (c) => !c.cancelledAt || c.cancelledAt > obsEnd
      ).length;
      retention.push({ offset, month: obsKey, count, pct: Math.round((count / size) * 100) });
      offset++;
      obsStart = new Date(obsStart.getFullYear(), obsStart.getMonth() + 1, 1);
    }

    return { cohortMonth: cohortKey, size, retention };
  });
}
