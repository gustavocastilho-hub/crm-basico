import { PrismaClient, StageType } from '@prisma/client';
import { CreateStageInput, UpdateStageInput, ReorderStagesInput } from './stages.schema';

const prisma = new PrismaClient();

export async function listStages() {
  return prisma.stage.findMany({ orderBy: { position: 'asc' } });
}

export async function createStage(data: CreateStageInput) {
  const max = await prisma.stage.aggregate({ _max: { position: true } });
  const key = `CUSTOM_${Date.now()}`;
  return prisma.stage.create({
    data: {
      key,
      label: data.label,
      color: data.color,
      type: data.type as StageType,
      position: (max._max.position ?? -1) + 1,
    },
  });
}

export async function updateStage(id: string, data: UpdateStageInput) {
  const existing = await prisma.stage.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Etapa não encontrada' };

  return prisma.stage.update({
    where: { id },
    data: {
      label: data.label,
      color: data.color,
      type: data.type as StageType | undefined,
    },
  });
}

export async function deleteStage(id: string) {
  const existing = await prisma.stage.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: 'Etapa não encontrada' };

  const dealsCount = await prisma.deal.count({ where: { stageId: id } });
  if (dealsCount > 0) {
    throw { status: 409, message: 'Não é possível remover: existem negócios nesta etapa' };
  }

  await prisma.stage.delete({ where: { id } });
}

export async function reorderStages(data: ReorderStagesInput) {
  const stages = await prisma.stage.findMany({ select: { id: true } });
  const existingIds = new Set(stages.map((s) => s.id));
  for (const id of data.ids) {
    if (!existingIds.has(id)) {
      throw { status: 400, message: `Etapa ${id} não existe` };
    }
  }
  if (data.ids.length !== stages.length) {
    throw { status: 400, message: 'Lista de etapas incompleta' };
  }

  await prisma.$transaction(
    data.ids.map((id, idx) =>
      prisma.stage.update({ where: { id }, data: { position: idx } })
    )
  );

  return prisma.stage.findMany({ orderBy: { position: 'asc' } });
}
