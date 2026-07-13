import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getProfile(req.user!.userId, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.updateProfile(req.user!.userId, req.user!.role, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getDashboard(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getPoints(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
