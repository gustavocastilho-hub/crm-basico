import { PrismaClient } from '@prisma/client';
import { CreatePlanInput } from './plans.schema';

const prisma = new PrismaClient();

export async function listPlans() {
  return prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function createPlan(data: CreatePlanInput) {
  const existing = await prisma.plan.findUnique({ where: { name: data.name } });
  if (existing) throw { status: 409, message: 'Plano já cadastrado' };
  return prisma.plan.create({ data });
}

export async function deletePlan(id: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw { status: 404, message: 'Plano não encontrado' };

  const count = await prisma.deal.count({ where: { planId: id } });
  if (count > 0) throw { status: 409, message: `Plano está em uso por ${count} negócio(s) e não pode ser removido` };

  await prisma.plan.delete({ where: { id } });
}
