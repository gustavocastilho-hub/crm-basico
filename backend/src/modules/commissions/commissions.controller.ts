import { Request, Response, NextFunction } from 'express';
import { createCommissionSchema, updateCommissionSchema } from './commissions.schema';
import * as commissionsService from './commissions.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const items = await commissionsService.listCommissions({
      startDate,
      endDate,
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function eligibleDeals(_req: Request, res: Response, next: NextFunction) {
  try {
    const deals = await commissionsService.listEligibleDeals();
    res.json(deals);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createCommissionSchema.parse(req.body);
    const item = await commissionsService.createCommission(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateCommissionSchema.parse(req.body);
    const item = await commissionsService.updateCommission(req.params.id, data);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await commissionsService.deleteCommission(req.params.id);
    res.json({ message: 'Comissão removida' });
  } catch (err) {
    next(err);
  }
}
