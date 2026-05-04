import { PrismaClient } from '@prisma/client';
import { CreateSdrContactInput, UpdateSdrContactInput } from './sdr.schema';

const prisma = new PrismaClient();

function parseDateOnly(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function listSdrContacts(params: { startDate?: string; endDate?: string }) {
  const where: any = {};
  if (params.startDate || params.endDate) {
    where.contactDate = {};
    if (params.startDate) where.contactDate.gte = parseDateOnly(params.startDate);
    if (params.endDate) where.contactDate.lte = parseDateOnly(params.endDate);
  }
  return prisma.sdrContact.findMany({
    where,
    orderBy: [{ contactDate: 'desc' }, { contactTime: 'desc' }],
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function createSdrContact(data: CreateSdrContactInput, userId: string) {
  return prisma.sdrContact.create({
    data: {
      contactDate: parseDateOnly(data.contactDate),
      contactTime: data.contactTime,
      name: data.name,
      company: data.company ?? null,
      whatsapp: data.whatsapp ?? null,
      summary: data.summary,
      userId,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function updateSdrContact(id: string, data: UpdateSdrContactInput) {
  const existing = await prisma.sdrContact.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Registro não encontrado' };

  return prisma.sdrContact.update({
    where: { id },
    data: {
      ...(data.contactDate ? { contactDate: parseDateOnly(data.contactDate) } : {}),
      ...(data.contactTime ? { contactTime: data.contactTime } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.company !== undefined ? { company: data.company ?? null } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp ?? null } : {}),
      ...(data.summary ? { summary: data.summary } : {}),
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function deleteSdrContact(id: string) {
  const existing = await prisma.sdrContact.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Registro não encontrado' };
  await prisma.sdrContact.delete({ where: { id } });
}
