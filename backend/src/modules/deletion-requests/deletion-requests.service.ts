import { PrismaClient, DeletionEntityType, DeletionRequestStatus } from '@prisma/client';
import {
  CreateDeletionRequestInput,
  RejectDeletionRequestInput,
} from './deletion-requests.schema';

const prisma = new PrismaClient();

const includeUsers = {
  requestedBy: { select: { id: true, name: true } },
  reviewedBy: { select: { id: true, name: true } },
};

export async function listDeletionRequests(
  currentUserId: string,
  isAdmin: boolean,
  status?: DeletionRequestStatus,
) {
  const where: any = {};
  if (!isAdmin) where.requestedById = currentUserId;
  if (status) where.status = status;
  return prisma.deletionRequest.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: includeUsers,
  });
}

async function resolveEntityLabel(
  entityType: DeletionEntityType,
  entityId: string,
): Promise<string | null> {
  if (entityType === 'CLIENT') {
    const c = await prisma.client.findUnique({
      where: { id: entityId },
      select: { name: true, company: true },
    });
    if (!c) return null;
    return c.company ? `${c.name} (${c.company})` : c.name;
  }
  const d = await prisma.deal.findUnique({
    where: { id: entityId },
    select: { title: true, client: { select: { name: true } } },
  });
  if (!d) return null;
  return `${d.title} — ${d.client.name}`;
}

export async function createDeletionRequest(
  data: CreateDeletionRequestInput,
  currentUserId: string,
) {
  const label = await resolveEntityLabel(data.entityType, data.entityId);
  if (!label) throw { status: 404, message: 'Registro não encontrado' };

  const existing = await prisma.deletionRequest.findFirst({
    where: {
      entityType: data.entityType,
      entityId: data.entityId,
      status: 'PENDING',
    },
  });
  if (existing) {
    throw { status: 409, message: 'Já existe uma solicitação pendente para este registro' };
  }

  return prisma.deletionRequest.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      entityLabel: label,
      reason: data.reason ?? null,
      requestedById: currentUserId,
    },
    include: includeUsers,
  });
}

export async function approveDeletionRequest(id: string, reviewerId: string) {
  const req = await prisma.deletionRequest.findUnique({ where: { id } });
  if (!req) throw { status: 404, message: 'Solicitação não encontrada' };
  if (req.status !== 'PENDING') throw { status: 400, message: 'Solicitação já foi processada' };

  return prisma.$transaction(async (tx) => {
    if (req.entityType === 'CLIENT') {
      const c = await tx.client.findUnique({ where: { id: req.entityId } });
      if (c) await tx.client.delete({ where: { id: req.entityId } });
    } else {
      const d = await tx.deal.findUnique({ where: { id: req.entityId } });
      if (d) await tx.deal.delete({ where: { id: req.entityId } });
    }
    return tx.deletionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: includeUsers,
    });
  });
}

export async function rejectDeletionRequest(
  id: string,
  reviewerId: string,
  data: RejectDeletionRequestInput,
) {
  const req = await prisma.deletionRequest.findUnique({ where: { id } });
  if (!req) throw { status: 404, message: 'Solicitação não encontrada' };
  if (req.status !== 'PENDING') throw { status: 400, message: 'Solicitação já foi processada' };

  return prisma.deletionRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: data.reviewNotes ?? null,
    },
    include: includeUsers,
  });
}

export async function cancelDeletionRequest(
  id: string,
  currentUserId: string,
  isAdmin: boolean,
) {
  const req = await prisma.deletionRequest.findUnique({ where: { id } });
  if (!req) throw { status: 404, message: 'Solicitação não encontrada' };
  if (req.status !== 'PENDING') throw { status: 400, message: 'Solicitação já foi processada' };
  if (!isAdmin && req.requestedById !== currentUserId) {
    throw { status: 403, message: 'Sem permissão' };
  }
  await prisma.deletionRequest.delete({ where: { id } });
}

export async function getPendingCount(currentUserId: string, isAdmin: boolean) {
  const where: any = { status: 'PENDING' };
  if (!isAdmin) where.requestedById = currentUserId;
  return prisma.deletionRequest.count({ where });
}
