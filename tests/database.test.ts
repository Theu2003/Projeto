import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const schemaPath = join(__dirname, '../server/prisma/schema.prisma');

describe('Prisma Schema', () => {
  let schemaContent: string;

  beforeAll(() => {
    schemaContent = readFileSync(schemaPath, 'utf-8');
  });

  it('should have datasource configured for SQLite', () => {
    expect(schemaContent).toContain('provider = "sqlite"');
  });

  it('should define User model with required fields', () => {
    expect(schemaContent).toContain('model User');
    expect(schemaContent).toMatch(/model User[\s\S]*?id\s+String\s+@id\s+@default\(cuid\(\)\)/);
    expect(schemaContent).toMatch(/model User[\s\S]*?email\s+String\s+@unique/);
    expect(schemaContent).toMatch(/model User[\s\S]*?passwordHash\s+String/);
    expect(schemaContent).toMatch(/model User[\s\S]*?role\s+String/);
    expect(schemaContent).toMatch(/model User[\s\S]*?points\s+Int\s+@default\(0\)/);
  });

  it('should define Company model with required fields', () => {
    expect(schemaContent).toContain('model Company');
    expect(schemaContent).toMatch(/model Company[\s\S]*?id\s+String\s+@id\s+@default\(cuid\(\)\)/);
    expect(schemaContent).toMatch(/model Company[\s\S]*?cnpj\s+String\s+@unique/);
    expect(schemaContent).toMatch(/model Company[\s\S]*?email\s+String\s+@unique/);
    expect(schemaContent).toMatch(/model Company[\s\S]*?approved\s+Boolean\s+@default\(false\)/);
    expect(schemaContent).toMatch(/model Company[\s\S]*?rating\s+Float\s+@default\(0\)/);
  });

  it('should define CollectionRequest model with status enum values', () => {
    expect(schemaContent).toContain('model CollectionRequest');
    expect(schemaContent).toMatch(/model CollectionRequest[\s\S]*?status\s+String/);
    expect(schemaContent).toMatch(/model CollectionRequest[\s\S]*?materialType\s+String/);
    expect(schemaContent).toMatch(/model CollectionRequest[\s\S]*?quantityKg\s+Float/);
  });

  it('should define Material model', () => {
    expect(schemaContent).toContain('model Material');
    expect(schemaContent).toMatch(/model Material[\s\S]*?id\s+String\s+@id\s+@default\(cuid\(\)\)/);
    expect(schemaContent).toMatch(/model Material[\s\S]*?name\s+String/);
    expect(schemaContent).toMatch(/model Material[\s\S]*?pointsPerKg\s+Int/);
  });

  it('should define Review model', () => {
    expect(schemaContent).toContain('model Review');
    expect(schemaContent).toMatch(/model Review[\s\S]*?rating\s+Int/);
  });

  it('should define Notification model', () => {
    expect(schemaContent).toContain('model Notification');
    expect(schemaContent).toMatch(/model Notification[\s\S]*?type\s+String/);
    expect(schemaContent).toMatch(/model Notification[\s\S]*?read\s+Boolean\s+@default\(false\)/);
  });

  it('should define Address model', () => {
    expect(schemaContent).toContain('model Address');
    expect(schemaContent).toMatch(/model Address[\s\S]*?street\s+String/);
    expect(schemaContent).toMatch(/model Address[\s\S]*?isDefault\s+Boolean\s+@default\(false\)/);
  });

  it('should define proper relationships via foreign keys', () => {
    expect(schemaContent).toMatch(/model CollectionRequest[\s\S]*?userId\s+String/);
    expect(schemaContent).toMatch(/model CollectionRequest[\s\S]*?companyId\s+String\?/);
    expect(schemaContent).toMatch(/model Review[\s\S]*?requestId\s+String\s+@unique/);
    expect(schemaContent).toMatch(/model Notification[\s\S]*?userId\s+String\?/);
    expect(schemaContent).toMatch(/model Notification[\s\S]*?companyId\s+String\?/);
  });
});

describe('Database Config', () => {
  it('should export a PrismaClient instance', async () => {
    const { prisma } = await import('../server/src/config/database');
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });
});

describe('Seed Script', () => {
  it('should export a main function', async () => {
    const seed = await import('../server/prisma/seed');
    expect(seed.main).toBeDefined();
    expect(typeof seed.main).toBe('function');
  });

  it('should seed materials into the database', async () => {
    const { main } = await import('../server/prisma/seed');
    await main();

    const { prisma } = await import('../server/src/config/database');
    const materials = await prisma.material.findMany();
    expect(materials.length).toBeGreaterThanOrEqual(8);

    const papel = materials.find(m => m.id === 'papel');
    expect(papel).toBeDefined();
    expect(papel!.name).toBe('Papel');
    expect(papel!.pointsPerKg).toBe(10);
    expect(papel!.recyclable).toBe(true);

    const naoReciclavel = materials.find(m => m.id === 'nao_reciclavel');
    expect(naoReciclavel).toBeDefined();
    expect(naoReciclavel!.recyclable).toBe(false);
    expect(naoReciclavel!.pointsPerKg).toBe(0);
  });
});
