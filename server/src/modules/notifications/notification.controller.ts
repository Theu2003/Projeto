import { Request, Response, NextFunction } from 'express';
import * as notificationService from './notification.service';

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.listNotifications(
      req.user!.userId,
      req.user!.role
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAsRead(
      String(req.params.id),
      req.user!.userId,
      req.user!.role
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
