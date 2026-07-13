import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function registerResident(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerResident(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function registerCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.registerCompany(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
