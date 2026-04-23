import { PrismaClient } from '@prisma/client';
import { CreateNicheInput } from './niches.schema';

const prisma = new PrismaClient();

export async function listNiches() {
  return prisma.niche.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function createNiche(data: CreateNicheInput) {
  const existing = await prisma.niche.findUnique({ where: { name: data.name } });
  if (existing) throw { status: 409, message: 'Nicho já cadastrado' };
  return prisma.niche.create({ data });
}

export async function deleteNiche(id: string) {
  const niche = await prisma.niche.findUnique({ where: { id } });
  if (!niche) throw { status: 404, message: 'Nicho não encontrado' };

  const count = await prisma.deal.count({ where: { nicheId: id } });
  if (count > 0) throw { status: 409, message: `Nicho está em uso por ${count} negócio(s) e não pode ser removido` };

  await prisma.niche.delete({ where: { id } });
}
