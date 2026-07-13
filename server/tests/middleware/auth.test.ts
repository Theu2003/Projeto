import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

const prisma = new PrismaClient();

describe('Auth Middleware', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('authenticateToken', () => {
    it('should pass with valid token', async () => {
      const { registerResident } = await import('@/modules/auth/auth.service');
      
      const { token } = await registerResident({
        name: 'João Silva',
        cpf: '77777777771',
        phone: '11999999999',
        email: 'middleware-test-1@email.com',
        password: '123456',
      });

      const { authenticateToken } = await import('@/middleware/auth');
      const mockReq = { headers: { authorization: `Bearer ${token}` } } as any;
      const mockRes = { status: () => mockRes, json: () => {} } as any;
      let called = false;
      const mockNext = () => { called = true; };

      authenticateToken(mockReq, mockRes, mockNext);

      expect(called).toBe(true);
      expect(mockReq.user).toBeDefined();
    });

    it('should reject without token', async () => {
      const { authenticateToken } = await import('@/middleware/auth');
      const mockReq = { headers: {} } as any;
      let statusCode: number = 0;
      const mockRes = { status: (code: number) => { statusCode = code; return mockRes; }, json: () => {} } as any;
      let called = false;
      const mockNext = () => { called = true; };

      authenticateToken(mockReq, mockRes, mockNext);

      expect(called).toBe(false);
      expect(statusCode).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const { authenticateToken } = await import('@/middleware/auth');
      const mockReq = { headers: { authorization: 'Bearer invalid-token' } } as any;
      let statusCode: number = 0;
      const mockRes = { status: (code: number) => { statusCode = code; return mockRes; }, json: () => {} } as any;
      let called = false;
      const mockNext = () => { called = true; };

      authenticateToken(mockReq, mockRes, mockNext);

      expect(called).toBe(false);
      expect(statusCode).toBe(403);
    });
  });

  describe('requireRole', () => {
    it('should pass with correct role', async () => {
      const { registerResident } = await import('@/modules/auth/auth.service');
      
      const { token } = await registerResident({
        name: 'João Silva',
        cpf: '77777777772',
        phone: '11999999999',
        email: 'middleware-test-2@email.com',
        password: '123456',
      });

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const { requireRole } = await import('@/middleware/auth');
      const mockReq = { user: decoded } as any;
      let called = false;
      const mockRes = { status: () => mockRes, json: () => {} } as any;
      const mockNext = () => { called = true; };

      const middleware = requireRole('resident');
      middleware(mockReq, mockRes, mockNext);

      expect(called).toBe(true);
    });

    it('should reject with wrong role', async () => {
      const { registerResident } = await import('@/modules/auth/auth.service');
      
      const { token } = await registerResident({
        name: 'João Silva',
        cpf: '77777777773',
        phone: '11999999999',
        email: 'middleware-test-3@email.com',
        password: '123456',
      });

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const { requireRole } = await import('@/middleware/auth');
      const mockReq = { user: decoded } as any;
      let statusCode: number = 0;
      let called = false;
      const mockRes = { status: (code: number) => { statusCode = code; return mockRes; }, json: () => {} } as any;
      const mockNext = () => { called = true; };

      const middleware = requireRole('admin');
      middleware(mockReq, mockRes, mockNext);

      expect(called).toBe(false);
      expect(statusCode).toBe(403);
    });
  });
});
