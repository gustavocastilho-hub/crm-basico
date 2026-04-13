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

export async function recentActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getRecentActivities(req.ownerFilter!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
