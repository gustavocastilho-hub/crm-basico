import { Request, Response, NextFunction } from 'express';
import { createPlanSchema } from './plans.schema';
import * as plansService from './plans.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await plansService.listPlans();
    res.json(plans);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPlanSchema.parse(req.body);
    const plan = await plansService.createPlan(data);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await plansService.deletePlan(req.params.id);
    res.json({ message: 'Plano removido' });
  } catch (err) {
    next(err);
  }
}
