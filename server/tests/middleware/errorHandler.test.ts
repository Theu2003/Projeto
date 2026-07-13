import { describe, it, expect, vi } from 'vitest';
import { errorHandler, AppError } from '@/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  it('should handle AppError correctly', () => {
    const error = new AppError('Not found', 404);
    
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });

  it('should handle error middleware', () => {
    const mockReq = {} as any;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const mockNext = vi.fn();

    const error = new Error('Test error');
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle AppError in error middleware', () => {
    const mockReq = {} as any;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const mockNext = vi.fn();

    const error = new AppError('Not found', 404);
    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Not found',
    });
  });
});
