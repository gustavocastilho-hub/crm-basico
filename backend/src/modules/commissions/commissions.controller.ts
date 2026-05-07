import { Request, Response, NextFunction } from 'express';
import {
  createBatchSchema,
  updateCommissionSchema,
  markPaidSchema,
  addPaymentSchema,
} from './commissions.schema';
import * as commissionsService from './commissions.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, referenceMonth, status } = req.query as {
      startDate?: string;
      endDate?: string;
      referenceMonth?: string;
      status?: 'UNPAID' | 'PAID';
    };
    const items = await commissionsService.listCommissions({
      startDate,
      endDate,
      referenceMonth,
      status,
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function eligibleDeals(req: Request, res: Response, next: NextFunction) {
  try {
    const { referenceMonth } = req.query as { referenceMonth?: string };
    const deals = await commissionsService.listEligibleDeals(referenceMonth);
    res.json(deals);
  } catch (err) {
    next(err);
  }
}

export async function createBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBatchSchema.parse(req.body);
    const items = await commissionsService.createBatch(data);
    res.status(201).json(items);
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

export async function pay(req: Request, res: Response, next: NextFunction) {
  try {
    const data = markPaidSchema.parse(req.body);
    const item = await commissionsService.markPaid(req.params.id, data);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function unpay(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await commissionsService.markUnpaid(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await commissionsService.listPayments(req.params.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function listPaymentsByMonth(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentMonth } = req.query as { paymentMonth?: string };
    const items = await commissionsService.listPaymentsByMonth({
      paymentMonth,
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function listPaymentBatches(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentMonth, referenceMonth } = req.query as {
      paymentMonth?: string;
      referenceMonth?: string;
    };
    const items = await commissionsService.listPaymentBatches(paymentMonth ?? referenceMonth);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getPaymentBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await commissionsService.getPaymentBatch(req.params.batchId);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function removePaymentBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await commissionsService.deletePaymentBatch(req.params.batchId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function addPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = addPaymentSchema.parse(req.body);
    const file = (req as any).file as
      | { buffer: Buffer; mimetype: string; originalname: string }
      | undefined;
    const item = await commissionsService.addPayment(req.params.id, data, file);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await commissionsService.deletePayment(req.params.id, req.params.pid);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function estimate(req: Request, res: Response, next: NextFunction) {
  try {
    const { referenceMonth } = req.query as { referenceMonth?: string };
    if (!referenceMonth || !/^\d{4}-\d{2}$/.test(referenceMonth)) {
      throw { status: 400, message: 'Parâmetro referenceMonth (YYYY-MM) é obrigatório' };
    }
    const data = await commissionsService.estimate(referenceMonth);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
