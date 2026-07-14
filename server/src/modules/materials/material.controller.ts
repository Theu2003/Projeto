import { Request, Response, NextFunction } from 'express';
import * as materialService from './material.service';

export async function listMaterials(_req: Request, res: Response, next: NextFunction) {
  try {
    const materials = await materialService.listMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
}
