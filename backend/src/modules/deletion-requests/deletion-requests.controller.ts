import { Request, Response, NextFunction } from 'express';
import { DeletionRequestStatus } from '@prisma/client';
import {
  createDeletionRequestSchema,
  rejectDeletionRequestSchema,
} from './deletion-requests.schema';
import * as service from './deletion-requests.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const statusRaw = req.query.status as string | undefined;
    const status =
      statusRaw && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusRaw)
        ? (statusRaw as DeletionRequestStatus)
        : undefined;
    const items = await service.listDeletionRequests(
      req.user!.userId,
      req.user!.role === 'ADMIN',
      status,
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function pendingCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await service.getPendingCount(
      req.user!.userId,
      req.user!.role === 'ADMIN',
    );
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createDeletionRequestSchema.parse(req.body);
    const item = await service.createDeletionRequest(data, req.user!.userId);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.approveDeletionRequest(req.params.id, req.user!.userId);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = rejectDeletionRequestSchema.parse(req.body ?? {});
    const item = await service.rejectDeletionRequest(req.params.id, req.user!.userId, data);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    await service.cancelDeletionRequest(
      req.params.id,
      req.user!.userId,
      req.user!.role === 'ADMIN',
    );
    res.json({ message: 'Solicitação cancelada' });
  } catch (err) {
    next(err);
  }
}
