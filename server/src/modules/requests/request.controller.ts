import { Request, Response, NextFunction } from 'express';
import * as requestService from './request.service';

export async function createRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.createRequest(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.listRequests(req.user!.userId, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRequestById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.getRequestById(String(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.acceptRequest(String(req.params.id), req.user!.userId, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.rejectRequest(String(req.params.id), req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function onTheWay(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.onTheWay(String(req.params.id), req.user!.userId, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function completeRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.completeRequest(String(req.params.id), req.user!.userId, req.body, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.cancelRequest(String(req.params.id), req.user!.userId, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function rescheduleRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await requestService.rescheduleRequest(
      String(req.params.id),
      req.user!.userId,
      req.user!.role,
      req.body
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
