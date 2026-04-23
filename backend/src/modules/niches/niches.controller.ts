import { Request, Response, NextFunction } from 'express';
import { createNicheSchema } from './niches.schema';
import * as nichesService from './niches.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const niches = await nichesService.listNiches();
    res.json(niches);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createNicheSchema.parse(req.body);
    const niche = await nichesService.createNiche(data);
    res.status(201).json(niche);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await nichesService.deleteNiche(req.params.id);
    res.json({ message: 'Nicho removido' });
  } catch (err) {
    next(err);
  }
}
