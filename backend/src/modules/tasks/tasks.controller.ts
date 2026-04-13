import { Request, Response, NextFunction } from 'express';
import { createTaskSchema, updateTaskSchema } from './tasks.schema';
import * as tasksService from './tasks.service';
import { getPagination, paginatedResponse } from '../../utils/pagination';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const params = getPagination(req.query as any);
    const filters = {
      status: req.query.status as string | undefined,
      clientId: req.query.clientId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };
    const { tasks, total } = await tasksService.listTasks(
      req.ownerFilter!,
      filters,
      params.page,
      params.limit,
      params.skip
    );
    res.json(paginatedResponse(tasks, total, params));
  } catch (err) {
    next(err);
  }
}

export async function upcoming(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await tasksService.getUpcomingTasks(req.ownerFilter!);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.getTask(req.params.id, req.ownerFilter!);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await tasksService.createTask(data, req.user!.userId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTaskSchema.parse(req.body);
    const task = await tasksService.updateTask(req.params.id, data, req.ownerFilter!);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await tasksService.deleteTask(req.params.id, req.ownerFilter!);
    res.json({ message: 'Tarefa removida' });
  } catch (err) {
    next(err);
  }
}
