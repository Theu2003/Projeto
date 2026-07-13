import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '@/middleware/validate';

describe('Validate Middleware', () => {
  it('should pass with valid data', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = validate(schema);
    const mockReq = { body: { name: 'João', email: 'joao@email.com' } } as any;
    const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const mockNext = vi.fn();

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({ name: 'João', email: 'joao@email.com' });
  });

  it('should reject with invalid data', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = validate(schema);
    const mockReq = { body: { name: 'João', email: 'invalid-email' } } as any;
    const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const mockNext = vi.fn();

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should reject with missing fields', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = validate(schema);
    const mockReq = { body: { name: 'João' } } as any;
    const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const mockNext = vi.fn();

    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
