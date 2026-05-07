import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIVE_CLIENTS: { name: string; activatedAt: string | null }[] = [
  { name: 'Emagrecentro',                activatedAt: '2025-10-11' },
  { name: 'Clínica SQIN',               activatedAt: '2025-11-14' },
  { name: 'AKTKD',                       activatedAt: '2025-11-24' },
  { name: 'Projeto Broadway',            activatedAt: '2025-12-03' },
  { name: 'Top Training',               activatedAt: '2026-01-05' },
  { name: 'Guarajuba Beach & Country',  activatedAt: '2026-01-20' },
  { name: 'Village Centro de Estética', activatedAt: '2026-02-23' },
  { name: 'Academia Seven',             activatedAt: '2026-03-03' },
  { name: 'Felipe Dantas',              activatedAt: '2026-03-11' },
  { name: 'REDUTO STUDIO FITNESS',      activatedAt: '2026-03-09' },
  { name: 'Clinica Flessibilita',       activatedAt: '2026-03-11' },
  { name: 'LK3 CURSOS',                 activatedAt: '2026-03-12' },
  { name: 'Cia do Corpo',               activatedAt: '2026-04-06' },
  { name: 'Gracie Barra',               activatedAt: '2026-04-27' },
  { name: 'AJE DE BOXE',               activatedAt: '2026-04-23' },
  { name: 'Flexfitness',               activatedAt: null },
  { name: 'Luitz Prime Consórcio',     activatedAt: '2026-04-29' },
];

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const entry of ACTIVE_CLIENTS) {
    const client = await prisma.client.findFirst({
      where: { name: { contains: entry.name, mode: 'insensitive' } },
      select: { id: true, name: true },
    });

    if (!client) {
      console.log(`NÃO ENCONTRADO: "${entry.name}"`);
      notFound++;
      continue;
    }

    await prisma.client.update({
      where: { id: client.id },
      data: {
        status: 'ACTIVE',
        activatedAt: entry.activatedAt ? new Date(entry.activatedAt) : null,
      },
    });

    console.log(`OK: "${client.name}" → ACTIVE (${entry.activatedAt ?? 'sem data'})`);
    updated++;
  }

  console.log(`\nConcluído: ${updated} atualizados, ${notFound} não encontrados.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
