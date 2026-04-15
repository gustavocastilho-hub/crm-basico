import { Request, Response, NextFunction } from 'express';
import { submitContractFormSchema } from './contract-forms.schema';
import * as service from './contract-forms.service';

export async function getByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getClientByToken(req.params.token);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = submitContractFormSchema.parse(req.body);
    const submission = await service.submitForm(req.params.token, data);
    res.status(201).json({ id: submission.id, submittedAt: submission.submittedAt });
  } catch (err) {
    next(err);
  }
}
