import { PrismaClient } from '@prisma/client';
import { CreateImprovementInput, UpdateImprovementInput, BulkActionInput } from './improvements.schema';

const prisma = new PrismaClient();

const includeUsers = {
  user: { select: { id: true, name: true } },
  implementedBy: { select: { id: true, name: true } },
};

export async function listImprovements() {
  return prisma.improvementRequest.findMany({
    orderBy: [{ implemented: 'asc' }, { createdAt: 'desc' }],
    include: includeUsers,
  });
}

export async function createImprovement(data: CreateImprovementInput, userId: string) {
  return prisma.improvementRequest.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      userId,
    },
    include: includeUsers,
  });
}

export async function updateImprovement(
  id: string,
  data: UpdateImprovementInput,
  currentUserId: string,
  isAdmin: boolean
) {
  const existing = await prisma.improvementRequest.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Pedido não encontrado' };
  if (!isAdmin && existing.userId !== currentUserId) {
    throw { status: 403, message: 'Sem permissão' };
  }

  return prisma.improvementRequest.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    },
    include: includeUsers,
  });
}

export async function setImplemented(id: string, implemented: boolean, adminUserId: string) {
  const existing = await prisma.improvementRequest.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Pedido não encontrado' };
  return prisma.improvementRequest.update({
    where: { id },
    data: {
      implemented,
      implementedAt: implemented ? new Date() : null,
      implementedById: implemented ? adminUserId : null,
    },
    include: includeUsers,
  });
}

export async function deleteImprovement(id: string, currentUserId: string, isAdmin: boolean) {
  const existing = await prisma.improvementRequest.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Pedido não encontrado' };
  if (!isAdmin && existing.userId !== currentUserId) {
    throw { status: 403, message: 'Sem permissão' };
  }
  await prisma.improvementRequest.delete({ where: { id } });
}

export async function bulkAction(
  data: BulkActionInput,
  currentUserId: string,
  isAdmin: boolean
) {
  if (data.action === 'delete') {
    const where: any = { id: { in: data.ids } };
    if (!isAdmin) where.userId = currentUserId;
    const deleted = await prisma.improvementRequest.deleteMany({ where });
    return { affected: deleted.count };
  }

  if (!isAdmin) throw { status: 403, message: 'Apenas ADMIN pode marcar como implementado' };

  if (data.action === 'mark_implemented') {
    const result = await prisma.improvementRequest.updateMany({
      where: { id: { in: data.ids } },
      data: {
        implemented: true,
        implementedAt: new Date(),
        implementedById: currentUserId,
      },
    });
    return { affected: result.count };
  }

  // mark_pending
  const result = await prisma.improvementRequest.updateMany({
    where: { id: { in: data.ids } },
    data: {
      implemented: false,
      implementedAt: null,
      implementedById: null,
    },
  });
  return { affected: result.count };
}
