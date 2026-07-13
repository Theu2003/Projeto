import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.listUsers();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listCompanies(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.listCompanies();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function approveCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.approveCompany(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.blockUser(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function blockCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.blockCompany(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getStats();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
