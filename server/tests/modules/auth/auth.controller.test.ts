import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Controller', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register/resident', () => {
    it('should register a new resident', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'João Silva',
          cpf: '99999999991',
          phone: '11999999999',
          email: 'controller-test-1@email.com',
          password: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('controller-test-1@email.com');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'João Silva',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register/company', () => {
    it('should register a new company', async () => {
      const res = await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'EcoRecicla LTDA',
          cnpj: '98765432000195',
          responsible: 'Maria Santos',
          phone: '11999999999',
          email: 'controller-company-1@email.com',
          password: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('company');
      expect(res.body).toHaveProperty('token');
      expect(res.body.company.approved).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'João Silva',
          cpf: '99999999992',
          phone: '11999999999',
          email: 'controller-test-2@email.com',
          password: '123456',
        });

      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'controller-test-2@email.com',
          password: '123456',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent-controller@email.com',
          password: '123456',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token', async () => {
      // Register first
      const registerRes = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'João Silva',
          cpf: '99999999993',
          phone: '11999999999',
          email: 'controller-test-3@email.com',
          password: '123456',
        });

      // Refresh
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: registerRes.body.refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(res.status).toBe(401);
    });
  });
});
