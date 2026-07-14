import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with status code
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware
 * Retorna erros estruturados para o cliente
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('❌ Erro inesperado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
