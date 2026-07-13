import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PRISMA_SCHEMA_PATH = resolve(__dirname, '../../prisma/schema.prisma');

describe('Prisma Schema', () => {
  it('schema file exists', () => {
    expect(existsSync(PRISMA_SCHEMA_PATH)).toBe(true);
  });

  it('defines User model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model User');
    expect(schema).toMatch(/id\s+String\s+@id/);
    expect(schema).toMatch(/name\s+String/);
    expect(schema).toMatch(/cpf\s+String\s+@unique/);
    expect(schema).toMatch(/email\s+String\s+@unique/);
    expect(schema).toMatch(/passwordHash\s+String/);
    expect(schema).toMatch(/role\s+String/);
    expect(schema).toMatch(/points\s+Int/);
    expect(schema).toMatch(/active\s+Boolean/);
  });

  it('defines Company model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model Company');
    expect(schema).toMatch(/cnpj\s+String\s+@unique/);
    expect(schema).toMatch(/responsible\s+String/);
    expect(schema).toMatch(/serviceAreaRadius\s+Float/);
    expect(schema).toMatch(/materials\s+String/);
    expect(schema).toMatch(/approved\s+Boolean/);
    expect(schema).toMatch(/rating\s+Float/);
  });

  it('defines CollectionRequest model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model CollectionRequest');
    expect(schema).toMatch(/userId\s+String/);
    expect(schema).toMatch(/companyId\s+String\?/);
    expect(schema).toMatch(/status\s+String/);
    expect(schema).toMatch(/materialType\s+String/);
    expect(schema).toMatch(/quantityKg\s+Float/);
    expect(schema).toMatch(/realWeight\s+Float\?/);
  });

  it('defines Material model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model Material');
    expect(schema).toMatch(/name\s+String/);
    expect(schema).toMatch(/icon\s+String/);
    expect(schema).toMatch(/category\s+String/);
    expect(schema).toMatch(/recyclable\s+Boolean/);
    expect(schema).toMatch(/pointsPerKg\s+Int/);
  });

  it('defines Review model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model Review');
    expect(schema).toMatch(/userId\s+String/);
    expect(schema).toMatch(/companyId\s+String/);
    expect(schema).toMatch(/requestId\s+String\s+@unique/);
    expect(schema).toMatch(/rating\s+Int/);
    expect(schema).toMatch(/comment\s+String\?/);
  });

  it('defines Notification model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model Notification');
    expect(schema).toMatch(/type\s+String/);
    expect(schema).toMatch(/message\s+String/);
    expect(schema).toMatch(/read\s+Boolean/);
    expect(schema).toMatch(/data\s+String/);
  });

  it('defines Address model with required fields', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('model Address');
    expect(schema).toMatch(/street\s+String/);
    expect(schema).toMatch(/number\s+String/);
    expect(schema).toMatch(/neighborhood\s+String/);
    expect(schema).toMatch(/city\s+String/);
    expect(schema).toMatch(/state\s+String/);
    expect(schema).toMatch(/zipCode\s+String/);
    expect(schema).toMatch(/latitude\s+Float\?/);
    expect(schema).toMatch(/longitude\s+Float\?/);
    expect(schema).toMatch(/isDefault\s+Boolean/);
  });

  it('uses SQLite provider', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('provider = "sqlite"');
  });

  it('generates PrismaClient', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('prisma-client-js');
  });

  it('has relations between User and CollectionRequest', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('@relation("UserRequests")');
  });

  it('has relations between Company and CollectionRequest', () => {
    const schema = readFileSync(PRISMA_SCHEMA_PATH, 'utf-8');
    expect(schema).toContain('@relation("CompanyRequests")');
  });
});

describe('Database Config', () => {
  it('exports a prisma client instance', async () => {
    const { prisma } = await import('../../src/config/database');
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });
});

describe('Seed Script', () => {
  it('seed file exists', () => {
    expect(existsSync(resolve(__dirname, '../../prisma/seed.ts'))).toBe(true);
  });

  it('exports a main function', async () => {
    const seed = await import('../../prisma/seed');
    expect(typeof seed.main).toBe('function');
  });
});
