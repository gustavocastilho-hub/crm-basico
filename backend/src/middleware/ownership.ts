import { Request, Response, NextFunction } from 'express';

export function ownershipFilter(req: Request, _res: Response, next: NextFunction) {
  req.ownerFilter = {};
  next();
}
