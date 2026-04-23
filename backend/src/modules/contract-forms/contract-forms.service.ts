import { PrismaClient, ContractStage } from '@prisma/client';
import { SubmitContractFormInput } from './contract-forms.schema';
import { advanceContractStageForClient } from '../deals/deals.service';

const prisma = new PrismaClient();

export async function getClientByToken(token: string) {
  const client = await prisma.client.findUnique({
    where: { formToken: token },
    select: { id: true, name: true },
  });
  if (!client) throw { status: 404, message: 'Formulário não encontrado' };
  return { clientName: client.name };
}

export async function submitForm(token: string, data: SubmitContractFormInput) {
  const client = await prisma.client.findUnique({
    where: { formToken: token },
    select: { id: true, ownerId: true },
  });
  if (!client) throw { status: 404, message: 'Formulário não encontrado' };

  const submission = await prisma.$transaction(async (tx) => {
    const created = await tx.contractSubmission.create({
      data: { ...data, clientId: client.id },
    });

    await tx.client.update({
      where: { id: client.id },
      data: {
        legalName: data.legalName,
        cnpj: data.cnpj,
        address: data.address,
        cityState: data.cityState,
        cep: data.cep,
        signerName: data.signerName,
        signerCpf: data.signerCpf,
        signerEmail: data.signerEmail,
        billingContact: data.billingContact,
      },
    });

    await tx.activity.create({
      data: {
        type: 'CONTRACT_FORM_SUBMITTED',
        content: `Formulário de contrato preenchido por ${data.signerName}`,
        clientId: client.id,
        userId: client.ownerId,
      },
    });

    return created;
  });

  await advanceContractStageForClient(
    client.id,
    [ContractStage.NOT_GENERATED, ContractStage.LINK_SENT],
    ContractStage.FORM_FILLED,
  );

  return submission;
}
