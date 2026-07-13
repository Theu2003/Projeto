import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
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
    it('registers a resident and returns user without passwordHash', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Maria Santos',
          cpf: '11111111111',
          phone: '11988887777',
          email: 'maria-unique@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('maria-unique@test.com');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('resident');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Another Maria',
          cpf: '11111111112',
          phone: '11988887777',
          email: 'maria-unique@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(409);
    });

    it('rejects duplicate CPF', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Another Person',
          cpf: '11111111111',
          phone: '11988887777',
          email: 'different@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(409);
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Short Pass',
          cpf: '22222222222',
          phone: '11988887777',
          email: 'short@test.com',
          password: 'ab',
        });

      expect(res.status).toBe(400);
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Bad Email',
          cpf: '33333333333',
          phone: '11988887777',
          email: 'not-an-email',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register/company', () => {
    it('registers a company with approved=false by default', async () => {
      const res = await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'EcoTest LTDA',
          cnpj: '11111111000191',
          responsible: 'João Silva',
          phone: '11988887777',
          email: 'ecotest-unique@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(201);
      expect(res.body.company).toBeDefined();
      expect(res.body.company.approved).toBe(false);
      expect(res.body.company.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in resident with correct credentials', async () => {
      await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Login Resident',
          cpf: '44444444444',
          phone: '11988887777',
          email: 'login-resident@test.com',
          password: 'mypassword',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-resident@test.com', password: 'mypassword' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('login-resident@test.com');
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-resident@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'whatever' });

      expect(res.status).toBe(401);
    });

    it('can login as company', async () => {
      await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'Login Company',
          cnpj: '55555555000195',
          responsible: 'Ana',
          phone: '11988887777',
          email: 'login-company@test.com',
          password: 'companypass',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login-company@test.com', password: 'companypass' });

      expect(res.status).toBe(200);
      expect(res.body.company).toBeDefined();
      expect(res.body.company.email).toBe('login-company@test.com');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('issues new tokens with valid refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Refresh Resident',
          cpf: '66666666666',
          phone: '11988887777',
          email: 'refresh@test.com',
          password: 'secret123',
        });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: registerRes.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('rejects invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'totally-fake-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('full auth flow', () => {
    it('returns 403 when resident token is used on company route', async () => {
      await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Role Test Resident',
          cpf: '11223344556',
          phone: '11988887777',
          email: 'role-test-resident@test.com',
          password: 'secret123',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'role-test-resident@test.com', password: 'secret123' });

      const res = await request(app)
        .get('/api/companies/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(403);
    });

    it('returns 403 when company token is used on resident route', async () => {
      await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'Role Test Company',
          cnpj: '11223344556677',
          responsible: 'Test',
          phone: '11988887777',
          email: 'role-test-company@test.com',
          password: 'secret123',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'role-test-company@test.com', password: 'secret123' });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(403);
    });

    it('returns 403 with malformed Bearer token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(403);
    });

    it('returns 401 with empty Bearer value', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
    });

    it('register → login → use token → refresh', async () => {
      // Register
      const regRes = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Flow Resident',
          cpf: '77777777777',
          phone: '11988887777',
          email: 'flow@test.com',
          password: 'flowpass',
        });
      expect(regRes.status).toBe(201);
      const regToken = regRes.body.token;

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'flow@test.com', password: 'flowpass' });
      expect(loginRes.status).toBe(200);
      const loginToken = loginRes.body.token;

      // Use token to access protected endpoint
      const profileRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginToken}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.email).toBe('flow@test.com');

      // Refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken });
      expect(refreshRes.status).toBe(200);
    });

    it('returns 401 on protected route without token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('validation edge cases', () => {
    it('rejects registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          cpf: '88888888888',
          phone: '11988887777',
          email: 'no-name@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    it('rejects registration with missing CPF', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'No CPF',
          phone: '11988887777',
          email: 'no-cpf@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
    });

    it('rejects registration with short phone number', async () => {
      const res = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Short Phone',
          cpf: '99999999999',
          phone: '12345',
          email: 'short-phone@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
    });

    it('rejects login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'whatever' });

      expect(res.status).toBe(400);
    });

    it('rejects login with empty body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('rejects refresh token with a regular access token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Access Token Test',
          cpf: '10101010101',
          phone: '11988887777',
          email: 'access-token@test.com',
          password: 'secret123',
        });

      // Try to use the access token (not refresh token) for refresh
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: registerRes.body.token });

      expect(res.status).toBe(401);
    });

    it('rejects company registration with missing CNPJ', async () => {
      const res = await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'No CNPJ',
          responsible: 'Ana',
          phone: '11988887777',
          email: 'no-cnpj@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
    });

    it('rejects company registration with wrong CNPJ length', async () => {
      const res = await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'Short CNPJ',
          cnpj: '123',
          responsible: 'Ana',
          phone: '11988887777',
          email: 'short-cnpj@test.com',
          password: 'secret123',
        });

      expect(res.status).toBe(400);
    });
  });
});
