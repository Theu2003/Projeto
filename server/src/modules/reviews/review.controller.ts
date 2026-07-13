import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.createReview(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listReviewsByCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.listReviewsByCompany(String(req.params.companyId));
    res.json(result);
  } catch (error) {
    next(error);
  }
}
