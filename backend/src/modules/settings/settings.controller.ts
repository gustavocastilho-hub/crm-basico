import { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service';
import { updateCommissionsConfigSchema } from './settings.schema';

export async function getCommissions(_req: Request, res: Response, next: NextFunction) {
  try {
    const config = await settingsService.getCommissionsConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function updateCommissions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateCommissionsConfigSchema.parse(req.body);
    const config = await settingsService.updateCommissionsConfig(data);
    res.json(config);
  } catch (err) {
    next(err);
  }
}
