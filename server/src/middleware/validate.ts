import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware de validação usando Zod
 * Valida o body da requisição contra um schema definido
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Erro de validação',
        details: result.error.issues,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
