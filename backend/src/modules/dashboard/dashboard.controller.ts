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
    const yearRaw = parseInt(String(req.query.year ?? ''), 10);
    const monthRaw = parseInt(String(req.query.month ?? ''), 10);
    const year = Number.isFinite(yearRaw) && yearRaw >= 1970 && yearRaw <= 9999 ? yearRaw : now.getFullYear();
    const month = Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : now.getMonth() + 1;
    const data = await dashboardService.getLeadsBySource(req.ownerFilter!, year, month);
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
