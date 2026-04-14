import { Request, Response, NextFunction } from 'express';
import { createStageSchema, updateStageSchema, reorderStagesSchema } from './stages.schema';
import * as stagesService from './stages.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const stages = await stagesService.listStages();
    res.json(stages);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createStageSchema.parse(req.body);
    const stage = await stagesService.createStage(data);
    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateStageSchema.parse(req.body);
    const stage = await stagesService.updateStage(req.params.id, data);
    res.json(stage);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await stagesService.deleteStage(req.params.id);
    res.json({ message: 'Etapa removida' });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = reorderStagesSchema.parse(req.body);
    const stages = await stagesService.reorderStages(data);
    res.json(stages);
  } catch (err) {
    next(err);
  }
}
