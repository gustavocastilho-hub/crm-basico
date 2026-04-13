import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function ownershipFilter(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role === Role.ADMIN) {
    req.ownerFilter = {};
  } else {
    req.ownerFilter = { ownerId: req.user!.userId };
  }
  next();
}
