import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEYS = {
  planFee: (planId: string) => `plan_implementation_fee.${planId}`,
  pctSdr: 'commission_percentage.SDR',
  pctNonSdr: 'commission_percentage.NON_SDR',
  defaultSdrUserId: 'default_sdr_user_id',
};

const DEFAULT_PLAN_FEES: Record<string, number> = {
  start: 500,
  pleno: 750,
};
const DEFAULT_PCT_SDR = 50;
const DEFAULT_PCT_NON_SDR = 25;

export async function getValue(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setValue(key: string, value: string) {
  return prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getCommissionsConfig() {
  const plans = await prisma.plan.findMany({ orderBy: { name: 'asc' } });
  const settings = await prisma.appSetting.findMany();
  const map = new Map(settings.map((s) => [s.key, s.value]));

  const planFees = plans.map((p) => {
    const stored = map.get(KEYS.planFee(p.id));
    const fallback = DEFAULT_PLAN_FEES[p.name.toLowerCase()] ?? 0;
    return {
      planId: p.id,
      planName: p.name,
      fee: stored !== undefined ? Number(stored) : fallback,
    };
  });

  const pctSdr = map.get(KEYS.pctSdr);
  const pctNonSdr = map.get(KEYS.pctNonSdr);
  const defaultSdrUserId = map.get(KEYS.defaultSdrUserId) ?? null;

  return {
    plans: planFees,
    percentages: {
      SDR: pctSdr !== undefined ? Number(pctSdr) : DEFAULT_PCT_SDR,
      NON_SDR: pctNonSdr !== undefined ? Number(pctNonSdr) : DEFAULT_PCT_NON_SDR,
    },
    defaultSdrUserId,
  };
}

export async function updateCommissionsConfig(input: {
  plans?: { planId: string; fee: number }[];
  percentages?: { SDR?: number; NON_SDR?: number };
  defaultSdrUserId?: string | null;
}) {
  const ops: Promise<unknown>[] = [];

  if (input.plans) {
    for (const p of input.plans) {
      ops.push(setValue(KEYS.planFee(p.planId), String(p.fee)));
    }
  }

  if (input.percentages?.SDR !== undefined) {
    ops.push(setValue(KEYS.pctSdr, String(input.percentages.SDR)));
  }
  if (input.percentages?.NON_SDR !== undefined) {
    ops.push(setValue(KEYS.pctNonSdr, String(input.percentages.NON_SDR)));
  }

  if (input.defaultSdrUserId !== undefined) {
    if (input.defaultSdrUserId === null || input.defaultSdrUserId === '') {
      ops.push(prisma.appSetting.deleteMany({ where: { key: KEYS.defaultSdrUserId } }));
    } else {
      ops.push(setValue(KEYS.defaultSdrUserId, input.defaultSdrUserId));
    }
  }

  await Promise.all(ops);
  return getCommissionsConfig();
}

export async function resolveDefaultSdrUserId(): Promise<string> {
  const stored = await getValue(KEYS.defaultSdrUserId);
  if (stored) {
    const exists = await prisma.user.findUnique({ where: { id: stored } });
    if (exists) return exists.id;
  }
  const fallback = await prisma.user.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!fallback) throw { status: 500, message: 'Nenhum usuário disponível para vincular como SDR' };
  return fallback.id;
}
