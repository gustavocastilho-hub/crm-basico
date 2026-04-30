import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getSummary(req.ownerFilter!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function salesByMonth(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getSalesByMonth(req.ownerFilter!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function conversionFunnel(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getConversionFunnel(req.ownerFilter!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function leadsBySource(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const parseDate = (raw: unknown) => {
      if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
      const [y, m, d] = raw.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return Number.isFinite(dt.getTime()) ? dt : null;
    };
    const startDate =
      parseDate(req.query.startDate) ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const endRaw = parseDate(req.query.endDate);
    const endDate = endRaw
      ? new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate() + 1)
      : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const data = await dashboardService.getLeadsBySource(req.ownerFilter!, startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function recentActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getRecentActivities(req.ownerFilter!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
