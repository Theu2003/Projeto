import { Request, Response, NextFunction } from 'express';
import * as companyService from './company.service';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await companyService.getProfile(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await companyService.updateProfile(req.user!.userId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await companyService.getDashboard(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function findNearby(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius } = req.query as any;
    const result = await companyService.findNearby(lat, lng, radius);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
