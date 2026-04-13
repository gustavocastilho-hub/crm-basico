import { PrismaClient, TaskStatus } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput } from './tasks.schema';

const prisma = new PrismaClient();

export async function listTasks(
  ownerFilter: any,
  filters: { status?: string; clientId?: string; from?: string; to?: string },
  page: number,
  limit: number,
  skip: number
) {
  const where: any = { ...ownerFilter };

  if (filters.status) {
    where.status = filters.status as TaskStatus;
  }
  if (filters.clientId) {
    where.clientId = filters.clientId;
  }
  if (filters.from || filters.to) {
    where.dueDate = {};
    if (filters.from) where.dueDate.gte = new Date(filters.from);
    if (filters.to) where.dueDate.lte = new Date(filters.to);
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

export async function getUpcomingTasks(ownerFilter: any) {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  return prisma.task.findMany({
    where: {
      ...ownerFilter,
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      dueDate: { gte: now, lte: nextWeek },
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function getTask(id: string, ownerFilter: any) {
  const task = await prisma.task.findFirst({
    where: { id, ...ownerFilter },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (!task) throw { status: 404, message: 'Tarefa não encontrada' };
  return task;
}

export async function createTask(data: CreateTaskInput, ownerId: string) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientId: data.clientId || null,
      ownerId,
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function updateTask(id: string, data: UpdateTaskInput, ownerFilter: any) {
  const existing = await prisma.task.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Tarefa não encontrada' };

  const updateData: any = { ...data };
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function deleteTask(id: string, ownerFilter: any) {
  const existing = await prisma.task.findFirst({ where: { id, ...ownerFilter } });
  if (!existing) throw { status: 404, message: 'Tarefa não encontrada' };

  await prisma.task.delete({ where: { id } });
}
