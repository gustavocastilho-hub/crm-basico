import { Request, Response, NextFunction } from 'express';
import {
  createImprovementSchema,
  updateImprovementSchema,
  bulkActionSchema,
} from './improvements.schema';
import * as service from './improvements.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listImprovements());
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createImprovementSchema.parse(req.body);
    const item = await service.createImprovement(data, req.user!.userId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateImprovementSchema.parse(req.body);
    const item = await service.updateImprovement(
      req.params.id,
      data,
      req.user!.userId,
      req.user!.role === 'ADMIN'
    );
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function setImplemented(req: Request, res: Response, next: NextFunction) {
  try {
    const implemented = req.body?.implemented !== false;
    const item = await service.setImplemented(req.params.id, implemented, req.user!.userId);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteImprovement(
      req.params.id,
      req.user!.userId,
      req.user!.role === 'ADMIN'
    );
    res.json({ message: 'Pedido removido' });
  } catch (err) {
    next(err);
  }
}

export async function bulk(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkActionSchema.parse(req.body);
    const result = await service.bulkAction(
      data,
      req.user!.userId,
      req.user!.role === 'ADMIN'
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
