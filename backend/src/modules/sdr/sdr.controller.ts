import { Request, Response, NextFunction } from 'express';
import { createSdrContactSchema, updateSdrContactSchema } from './sdr.schema';
import * as sdrService from './sdr.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const items = await sdrService.listSdrContacts({ startDate, endDate });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSdrContactSchema.parse(req.body);
    const item = await sdrService.createSdrContact(data, req.user!.userId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSdrContactSchema.parse(req.body);
    const item = await sdrService.updateSdrContact(req.params.id, data);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await sdrService.deleteSdrContact(req.params.id);
    res.json({ message: 'Registro removido' });
  } catch (err) {
    next(err);
  }
}
