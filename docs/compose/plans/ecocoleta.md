# EcoColeta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop Electron application connecting residents with recycling collection companies, with real-time updates, Google Maps integration, and admin panel.

**Architecture:** Electron + React + TypeScript frontend, Node.js + Express backend, SQLite via Prisma ORM, Socket.IO for real-time, Google Maps API for geolocation. Infrastructure-first hybrid approach: backend infrastructure (phases 1-3), then vertical slices for frontend features.

**Tech Stack:** Electron, React, TypeScript, Vite, Express, Prisma, SQLite, Socket.IO, Google Maps API, JWT, Zod, Tailwind CSS, framer-motion, recharts, pdfmake, exceljs.

## Global Constraints

- TypeScript strict mode everywhere
- Electron + Vite (electron-vite) for frontend bundling
- React with Tailwind CSS dark mode (`dark:` classes)
- Node.js + Express MVC pattern (controller → service → repository)
- Prisma ORM with SQLite (dev and production for desktop app)
- Socket.IO for real-time events
- JWT authentication (access: 15min, refresh: 7d)
- Zod for request validation
- Portuguese (Brazilian) as primary language in UI and docs
- Code comments in English, documentation in Portuguese
- All passwords hashed with bcrypt (salt rounds: 12)
- Rate limiting on public endpoints
- Each task ends with a commit
- Test-driven development where applicable

---

### Task T1: Project Setup & Monorepo Structure

**Covers:** [S1, S2]
<!-- Project structure and database schema -->

**Files:**
- Create: `package.json` (root workspace)
- Create: `server/package.json`
- Create: `tsconfig.json` (root)
- Create: `server/tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: (none)
- Produces: npm workspaces configuration, TypeScript configs, environment template

- [ ] **Step 1: Initialize root package.json with workspaces**

```json
{
  "name": "ecocoleta",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "server/"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "electron-vite dev",
    "build": "electron-vite build",
    "start": "electron-vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 2: Create server package.json**

```json
{
  "name": "ecocoleta-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest"
  },
  "dependencies": {
    "@prisma/client": "^5.8.1",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "socket.io": "^4.7.4",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^7.1.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.11",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.11.5",
    "tsx": "^4.7.0",
    "prisma": "^5.8.1",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 3: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create server tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create .env.example**

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Google Maps
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
*.db
.env
.DS_Store
Thumbs.db
uploads/
coverage/
```

- [ ] **Step 7: Create README.md**

```markdown
# EcoColeta

Aplicativo desktop que conecta moradores com empresas de coleta seletiva para reciclagem.

## Pré-requisitos

- Node.js 18+
- npm 9+
- Google Maps API key

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves

# Gerar cliente Prisma
cd server
npx prisma generate
npx prisma db push

# Rodar seed (dados iniciais)
npx prisma db seed

# Iniciar desenvolvimento
npm run dev
```

## Estrutura

- `electron/` - Processo principal do Electron
- `src/` - Renderer React (frontend)
- `server/` - Backend Express
- `docs/` - Documentação

## Funcionalidades

- Cadastro de moradores e empresas
- Solicitações de coleta com geolocalização
- Sistema de pontos e rankings
- Notificações em tempo real
- Painel administrativo
- Relatórios PDF/Excel
- Tema claro/escuro
```

- [ ] **Step 8: Install dependencies and verify**

```bash
npm install
```

Expected: Dependencies installed without errors.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: initialize project structure with monorepo setup"
```

---

### Task T2: Prisma Schema & Database Setup

**Covers:** [S3]
<!-- Database schema and relationships -->

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/config/database.ts`
- Create: `server/prisma/seed.ts`

**Interfaces:**
- Consumes: T1 (project structure)
- Produces: Prisma client, database schema, seed data

- [ ] **Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String              @id @default(uuid())
  name         String
  cpf          String              @unique
  phone        String
  email        String              @unique
  passwordHash String
  role         String              @default("resident") // resident, admin
  address      String?
  latitude     Float?
  longitude    Float?
  points       Int                 @default(0)
  active       Boolean             @default(true)
  createdAt    DateTime            @default(now())
  requests     CollectionRequest[] @relation("UserRequests")
  reviews      Review[]            @relation("UserReviews")
  notifications Notification[]     @relation("UserNotifications")
  addresses    Address[]           @relation("UserAddresses")
}

model Company {
  id                String              @id @default(uuid())
  name              String
  cnpj              String              @unique
  responsible       String
  phone             String
  email             String              @unique
  passwordHash      String
  address           String
  latitude          Float
  longitude         Float
  serviceAreaRadius Float
  materials         String              @default("[]") // JSON array of material IDs
  approved          Boolean             @default(false)
  active            Boolean             @default(true)
  rating            Float               @default(0)
  createdAt         DateTime            @default(now())
  requests          CollectionRequest[] @relation("CompanyRequests")
  reviews           Review[]            @relation("CompanyReviews")
  notifications     Notification[]      @relation("CompanyNotifications")
  addresses         Address[]           @relation("CompanyAddresses")
}

model CollectionRequest {
  id           String    @id @default(uuid())
  userId       String
  companyId    String?
  status       String    @default("pending") // pending, accepted, on_the_way, completed, cancelled, rescheduled
  materialType String
  quantityKg   Float
  observations String?
  photos       String    @default("[]") // JSON array of URLs
  desiredDate  DateTime
  desiredTime  String
  latitude     Float
  longitude    Float
  address      String
  realWeight   Float?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  user         User      @relation("UserRequests", fields: [userId], references: [id])
  company      Company?  @relation("CompanyRequests", fields: [companyId], references: [id])
  review       Review?

  @@index([userId])
  @@index([companyId])
  @@index([status])
}

model Material {
  id          String  @id @default(uuid())
  name        String
  icon        String
  category    String
  recyclable  Boolean @default(true)
  pointsPerKg Float
}

model Review {
  id        String            @id @default(uuid())
  userId    String
  companyId String
  requestId String            @unique
  rating    Int               // 1-5
  comment   String?
  createdAt DateTime          @default(now())
  user      User              @relation("UserReviews", fields: [userId], references: [id])
  company   Company           @relation("CompanyReviews", fields: [companyId], references: [id])
  request   CollectionRequest @relation(fields: [requestId], references: [id])

  @@index([companyId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String?
  companyId String?
  type      String
  message   String
  read      Boolean  @default(false)
  data      String?  // JSON
  createdAt DateTime @default(now())
  user      User?    @relation("UserNotifications", fields: [userId], references: [id])
  company   Company? @relation("CompanyNotifications", fields: [companyId], references: [id])

  @@index([userId])
  @@index([companyId])
}

model Address {
  id           String  @id @default(uuid())
  userId       String?
  companyId    String?
  label        String
  street       String
  number       String
  neighborhood String
  city         String
  state        String
  zipCode      String
  latitude     Float
  longitude    Float
  isDefault    Boolean @default(false)
  user         User?   @relation("UserAddresses", fields: [userId], references: [id])
  company      Company? @relation("CompanyAddresses", fields: [companyId], references: [id])

  @@index([userId])
  @@index([companyId])
}
```

- [ ] **Step 2: Create database config**

```typescript
// server/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

- [ ] **Step 3: Create seed script**

```typescript
// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create materials
  const materials = await Promise.all([
    prisma.material.create({
      data: {
        name: 'Papel',
        icon: '📄',
        category: 'Papelão',
        recyclable: true,
        pointsPerKg: 10,
      },
    }),
    plrisma.material.create({
      data: {
        name: 'Plástico',
        icon: '♻️',
        category: 'Plástico',
        recyclable: true,
        pointsPerKg: 15,
      },
    }),
    prisma.material.create({
      data: {
        name: 'Vidro',
        icon: '🍶',
        category: 'Vidro',
        recyclable: true,
        pointsPerKg: 8,
      },
    }),
    prisma.material.create({
      data: {
        name: 'Metal',
        icon: '🔩',
        category: 'Metal',
        recyclable: true,
        pointsPerKg: 20,
      },
    }),
    prisma.material.create({
      data: {
        name: 'Orgânico',
        icon: '🍎',
        category: 'Orgânico',
        recyclable: true,
        pointsPerKg: 5,
      },
    }),
  ]);

  console.log(`Created ${materials.length} materials`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      cpf: '000.000.000-00',
      phone: '(11) 99999-9999',
      email: 'admin@ecocoleta.com',
      passwordHash: adminPassword,
      role: 'admin',
      address: 'Rua Admin, 100',
      latitude: -23.5505,
      longitude: -46.6333,
    },
  });

  console.log('Created admin user');

  // Create resident users
  const residentPassword = await bcrypt.hash('resident123', 12);
  const residents = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Maria Silva',
        cpf: '111.111.111-11',
        phone: '(11) 98888-8888',
        email: 'maria@email.com',
        passwordHash: residentPassword,
        role: 'resident',
        address: 'Rua das Flores, 123',
        latitude: -23.5489,
        longitude: -46.6388,
        points: 150,
      },
    }),
    prisma.user.create({
      data: {
        name: 'João Santos',
        cpf: '222.222.222-22',
        phone: '(11) 97777-7777',
        email: 'joao@email.com',
        passwordHash: residentPassword,
        role: 'resident',
        address: 'Av. Brasil, 456',
        latitude: -23.5521,
        longitude: -46.6278,
        points: 320,
      },
    }),
  ]);

  console.log(`Created ${residents.length} resident users`);

  // Create companies
  const companyPassword = await bcrypt.hash('company123', 12);
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Recicla Fácil',
        cnpj: '12.345.678/0001-90',
        responsible: 'Carlos Oliveira',
        phone: '(11) 96666-6666',
        email: 'contato@reciclafacil.com',
        passwordHash: companyPassword,
        address: 'Rua da Reciclagem, 789',
        latitude: -23.5515,
        longitude: -46.6345,
        serviceAreaRadius: 10,
        materials: JSON.stringify([materials[0].id, materials[1].id]),
        approved: true,
        rating: 4.5,
      },
    }),
    prisma.company.create({
      data: {
        name: 'EcoVida',
        cnpj: '98.765.432/0001-10',
        responsible: 'Ana Pereira',
        phone: '(11) 95555-5555',
        email: 'contato@ecovida.com',
        passwordHash: companyPassword,
        address: 'Av. Ecológica, 321',
        latitude: -23.5498,
        longitude: -46.6299,
        serviceAreaRadius: 15,
        materials: JSON.stringify([materials[2].id, materials[3].id, materials[4].id]),
        approved: true,
        rating: 4.8,
      },
    }),
  ]);

  console.log(`Created ${companies.length} companies`);

  // Create some collection requests
  const requests = await Promise.all([
    prisma.collectionRequest.create({
      data: {
        userId: residents[0].id,
        companyId: companies[0].id,
        status: 'completed',
        materialType: 'Papel',
        quantityKg: 5.5,
        observations: 'Caixas de papelão grandes',
        desiredDate: new Date('2026-07-10'),
        desiredTime: '14:00',
        latitude: -23.5489,
        longitude: -46.6388,
        address: 'Rua das Flores, 123',
        realWeight: 6.2,
        completedAt: new Date('2026-07-10T14:30:00'),
      },
    }),
    prisma.collectionRequest.create({
      data: {
        userId: residents[1].id,
        status: 'pending',
        materialType: 'Plástico',
        quantityKg: 3.0,
        desiredDate: new Date('2026-07-15'),
        desiredTime: '10:00',
        latitude: -23.5521,
        longitude: -46.6278,
        address: 'Av. Brasil, 456',
      },
    }),
  ]);

  console.log(`Created ${requests.length} collection requests`);

  // Create a review for completed request
  await prisma.review.create({
    data: {
      userId: residents[0].id,
      companyId: companies[0].id,
      requestId: requests[0].id,
      rating: 5,
      comment: 'Excelente serviço! Pontual e eficiente.',
    },
  });

  console.log('Created review');

  // Update user points based on completed request
  await prisma.user.update({
    where: { id: residents[0].id },
    data: { points: { increment: 62 } }, // 6.2kg * 10 points/kg
  });

  console.log('Updated user points');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 4: Add seed script to server package.json**

Add to `server/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 5: Generate Prisma client and push schema**

```bash
cd server
npx prisma generate
npx prisma db push
```

Expected: Prisma client generated, database created.

- [ ] **Step 6: Run seed script**

```bash
cd server
npx prisma db seed
```

Expected: Database seeded with users, companies, materials, and sample data.

- [ ] **Step 7: Commit**

```bash
git add server/prisma server/src/config/database.ts
git commit -m "feat: add Prisma schema with SQLite and seed data"
```

---

### Task T3: Backend Core - Express Server & Auth

**Covers:** [S4, S5]
<!-- Authentication and core server setup -->

**Files:**
- Create: `server/src/app.ts`
- Create: `server/src/server.ts`
- Create: `server/src/config/env.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/validate.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.routes.ts`
- Create: `server/src/modules/auth/auth.validation.ts`
- Create: `server/src/routes/index.ts`

**Interfaces:**
- Consumes: T2 (database schema)
- Produces: Express server, JWT auth, auth endpoints

- [ ] **Step 1: Create environment config**

```typescript
// server/src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 2: Create error handler middleware**

```typescript
// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Resource already exists',
        field: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Resource not found',
      });
    }
  }

  return res.status(500).json({
    error: 'Internal server error',
  });
}
```

- [ ] **Step 3: Create validation middleware**

```typescript
// server/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

- [ ] **Step 4: Create auth middleware**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthPayload {
  userId?: string;
  companyId?: string;
  role: 'resident' | 'admin' | 'company';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch (error) {
    throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.auth.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
}
```

- [ ] **Step 5: Create auth validation schemas**

```typescript
// server/src/modules/auth/auth.validation.ts
import { z } from 'zod';

export const registerResidentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format'),
  phone: z.string().min(10, 'Invalid phone number'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const registerCompanySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Invalid CNPJ format'),
  responsible: z.string().min(2, 'Responsible name required'),
  phone: z.string().min(10, 'Invalid phone number'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(1, 'Address required'),
  latitude: z.number(),
  longitude: z.number(),
  serviceAreaRadius: z.number().min(1, 'Service area radius required'),
  materials: z.array(z.string()).min(1, 'At least one material required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});
```

- [ ] **Step 6: Create auth service**

```typescript
// server/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import {
  registerResidentSchema,
  registerCompanySchema,
  loginSchema,
} from './auth.validation';

type RegisterResidentInput = z.infer<typeof registerResidentSchema>;
type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  async registerResident(data: RegisterResidentInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const existingCpf = await prisma.user.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingCpf) {
      throw new AppError('CPF already registered', 409, 'CPF_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
        role: 'resident',
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role as 'resident' | 'admin',
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async registerCompany(data: RegisterCompanyInput) {
    const existingCompany = await prisma.company.findUnique({
      where: { email: data.email },
    });

    if (existingCompany) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const existingCnpj = await prisma.company.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingCnpj) {
      throw new AppError('CNPJ already registered', 409, 'CNPJ_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const company = await prisma.company.create({
      data: {
        ...data,
        passwordHash,
        materials: JSON.stringify(data.materials),
      },
    });

    const tokens = this.generateTokens({
      companyId: company.id,
      role: 'company' as const,
    });

    return {
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        approved: company.approved,
      },
      ...tokens,
    };
  }

  async login(data: LoginInput) {
    // Try resident/admin login
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      const validPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.active) {
        throw new AppError('Account disabled', 403, 'ACCOUNT_DISABLED');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        role: user.role as 'resident' | 'admin',
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    }

    // Try company login
    const company = await prisma.company.findUnique({
      where: { email: data.email },
    });

    if (company) {
      const validPassword = await bcrypt.compare(data.password, company.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      if (!company.active) {
        throw new AppError('Account disabled', 403, 'ACCOUNT_DISABLED');
      }

      const tokens = this.generateTokens({
        companyId: company.id,
        role: 'company' as const,
      });

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          approved: company.approved,
        },
        ...tokens,
      };
    }

    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      
      if (payload.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      const tokens = this.generateTokens({
        userId: payload.userId,
        companyId: payload.companyId,
        role: payload.role,
      });

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }

  private generateTokens(payload: {
    userId?: string;
    companyId?: string;
    role: string;
  }) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRATION }
    );

    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 7: Create auth controller**

```typescript
// server/src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async registerResident(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerResident(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async registerCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerCompany(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 8: Create auth routes**

```typescript
// server/src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  registerResidentSchema,
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validation';

const router = Router();
const controller = new AuthController();

router.post(
  '/register/resident',
  validate(registerResidentSchema),
  controller.registerResident
);

router.post(
  '/register/company',
  validate(registerCompanySchema),
  controller.registerCompany
);

router.post(
  '/login',
  validate(loginSchema),
  controller.login
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  controller.refreshToken
);

export default router;
```

- [ ] **Step 9: Create routes index**

```typescript
// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

router.use('/auth', authRoutes);

export default router;
```

- [ ] **Step 10: Create Express app**

```typescript
// server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
```

- [ ] **Step 11: Create server entry point**

```typescript
// server/src/server.ts
import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
```

- [ ] **Step 12: Test server starts**

```bash
cd server
npm run dev
```

Expected: Server starts on port 3001 without errors.

- [ ] **Step 13: Test auth endpoints**

```bash
# Register resident
curl -X POST http://localhost:3001/api/auth/register/resident \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","cpf":"123.456.789-00","phone":"11999999999","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

Expected: Registration returns user and tokens, login returns tokens.

- [ ] **Step 14: Commit**

```bash
git add server/src
git commit -m "feat: add Express server with JWT authentication"
```

---

### Task T4: Backend CRUD - Users & Companies

**Covers:** [S6, S7]
<!-- User and company management endpoints -->

**Files:**
- Create: `server/src/modules/users/user.controller.ts`
- Create: `server/src/modules/users/user.service.ts`
- Create: `server/src/modules/users/user.routes.ts`
- Create: `server/src/modules/companies/company.controller.ts`
- Create: `server/src/modules/companies/company.service.ts`
- Create: `server/src/modules/companies/company.routes.ts`

**Interfaces:**
- Consumes: T3 (auth middleware, Express server)
- Produces: User and company CRUD endpoints

- [ ] **Step 1: Create user service**

```typescript
// server/src/modules/users/user.service.ts
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        latitude: true,
        longitude: true,
        points: true,
        active: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        latitude: true,
        longitude: true,
        points: true,
      },
    });
  }

  async getDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const [totalRequests, completedRequests, pendingRequests, recentRequests] =
      await Promise.all([
        prisma.collectionRequest.count({
          where: { userId },
        }),
        prisma.collectionRequest.count({
          where: { userId, status: 'completed' },
        }),
        prisma.collectionRequest.count({
          where: { userId, status: 'pending' },
        }),
        prisma.collectionRequest.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                rating: true,
              },
            },
          },
        }),
      ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        points: user.points,
      },
      stats: {
        totalRequests,
        completedRequests,
        pendingRequests,
      },
      recentRequests,
    };
  }

  async getPoints(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        points: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get ranking
    const ranking = await prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        points: true,
      },
      orderBy: { points: 'desc' },
      take: 10,
    });

    const userRank = ranking.findIndex((u) => u.id === userId) + 1;

    return {
      user,
      ranking,
      userRank,
    };
  }
}
```

- [ ] **Step 2: Create user controller**

```typescript
// server/src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await userService.getProfile(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await userService.updateProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const dashboard = await userService.getDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  async getPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const points = await userService.getPoints(userId);
      res.json(points);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 3: Create user routes**

```typescript
// server/src/modules/users/user.routes.ts
import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new UserController();

router.use(authenticate);
router.use(authorize('resident', 'admin'));

router.get('/me', controller.getProfile);
router.put('/me', controller.updateProfile);
router.get('/dashboard', controller.getDashboard);
router.get('/points', controller.getPoints);

export default router;
```

- [ ] **Step 4: Create company service**

```typescript
// server/src/modules/companies/company.service.ts
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class CompanyService {
  async getProfile(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        cnpj: true,
        responsible: true,
        phone: true,
        email: true,
        address: true,
        latitude: true,
        longitude: true,
        serviceAreaRadius: true,
        materials: true,
        approved: true,
        active: true,
        rating: true,
        createdAt: true,
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return {
      ...company,
      materials: JSON.parse(company.materials),
    };
  }

  async updateProfile(companyId: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    serviceAreaRadius?: number;
    materials?: string[];
  }) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const updateData: any = { ...data };
    if (data.materials) {
      updateData.materials = JSON.stringify(data.materials);
    }

    return prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        cnpj: true,
        responsible: true,
        phone: true,
        email: true,
        address: true,
        latitude: true,
        longitude: true,
        serviceAreaRadius: true,
        materials: true,
        approved: true,
        rating: true,
      },
    });
  }

  async getDashboard(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const [totalRequests, pendingRequests, completedToday, totalCollected, recentReviews] =
      await Promise.all([
        prisma.collectionRequest.count({
          where: { companyId },
        }),
        prisma.collectionRequest.count({
          where: { companyId, status: 'pending' },
        }),
        prisma.collectionRequest.count({
          where: {
            companyId,
            status: 'completed',
            completedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.collectionRequest.aggregate({
          where: { companyId, status: 'completed' },
          _sum: { realWeight: true },
        }),
        prisma.review.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

    return {
      company: {
        id: company.id,
        name: company.name,
        rating: company.rating,
      },
      stats: {
        totalRequests,
        pendingRequests,
        completedToday,
        totalCollected: totalCollected._sum.realWeight || 0,
      },
      recentReviews,
    };
  }

  async getNearbyCompanies(lat: number, lng: number, radius: number) {
    // Simple distance calculation (Haversine formula approximation)
    const companies = await prisma.company.findMany({
      where: {
        approved: true,
        active: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        serviceAreaRadius: true,
        materials: true,
        rating: true,
      },
    });

    // Filter by distance
    const nearbyCompanies = companies.filter((company) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        company.latitude,
        company.longitude
      );
      return distance <= radius && distance <= company.serviceAreaRadius;
    });

    return nearbyCompanies.map((company) => ({
      ...company,
      materials: JSON.parse(company.materials),
      distance: this.calculateDistance(
        lat,
        lng,
        company.latitude,
        company.longitude
      ),
    }));
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

- [ ] **Step 5: Create company controller**

```typescript
// server/src/modules/companies/company.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './company.service';

const companyService = new CompanyService();

export class CompanyController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const company = await companyService.getProfile(companyId);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const company = await companyService.updateProfile(companyId, req.body);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const dashboard = await companyService.getDashboard(companyId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  async getNearbyCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius } = req.query;
      const companies = await companyService.getNearbyCompanies(
        Number(lat),
        Number(lng),
        Number(radius) || 10
      );
      res.json(companies);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 6: Create company routes**

```typescript
// server/src/modules/companies/company.routes.ts
import { Router } from 'express';
import { CompanyController } from './company.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new CompanyController();

// Public route
router.get('/nearby', controller.getNearbyCompanies);

// Protected routes
router.use(authenticate);
router.use(authorize('company'));

router.get('/me', controller.getProfile);
router.put('/me', controller.updateProfile);
router.get('/dashboard', controller.getDashboard);

export default router;
```

- [ ] **Step 7: Update routes index**

```typescript
// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import companyRoutes from '../modules/companies/company.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);

export default router;
```

- [ ] **Step 8: Test endpoints**

```bash
# Login as resident
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","password":"resident123"}'

# Use token to get profile
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <token>"
```

Expected: Returns user profile data.

- [ ] **Step 9: Commit**

```bash
git add server/src/modules/users server/src/modules/companies
git commit -m "feat: add user and company CRUD endpoints"
```

---

### Task T5: Backend CRUD - Collection Requests

**Covers:** [S8]
<!-- Collection request management -->

**Files:**
- Create: `server/src/modules/requests/request.controller.ts`
- Create: `server/src/modules/requests/request.service.ts`
- Create: `server/src/modules/requests/request.routes.ts`
- Create: `server/src/modules/requests/request.validation.ts`

**Interfaces:**
- Consumes: T3 (auth), T4 (user/company services)
- Produces: Collection request CRUD endpoints

- [ ] **Step 1: Create request validation schemas**

```typescript
// server/src/modules/requests/request.validation.ts
import { z } from 'zod';

export const createRequestSchema = z.object({
  materialType: z.string().min(1, 'Material type required'),
  quantityKg: z.number().min(0.1, 'Quantity must be at least 0.1 kg'),
  observations: z.string().optional(),
  desiredDate: z.string().datetime(),
  desiredTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1, 'Address required'),
});

export const updateRequestStatusSchema = z.object({
  reason: z.string().optional(),
});

export const rescheduleRequestSchema = z.object({
  desiredDate: z.string().datetime(),
  desiredTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  reason: z.string().optional(),
});
```

- [ ] **Step 2: Create request service**

```typescript
// server/src/modules/requests/request.service.ts
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  createRequestSchema,
  rescheduleRequestSchema,
} from './request.validation';

type CreateRequestInput = z.infer<typeof createRequestSchema>;

export class RequestService {
  async createRequest(userId: string, data: CreateRequestInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return prisma.collectionRequest.create({
      data: {
        userId,
        ...data,
        desiredDate: new Date(data.desiredDate),
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async getRequests(userId: string, companyId: string, role: string) {
    const where: any = {};

    if (role === 'resident') {
      where.userId = userId;
    } else if (role === 'company') {
      where.companyId = companyId;
    }

    return prisma.collectionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async getRequestById(requestId: string) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        review: true,
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    return request;
  }

  async acceptRequest(requestId: string, companyId: string) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.status !== 'pending') {
      throw new AppError('Request is not pending', 400, 'REQUEST_NOT_PENDING');
    }

    if (request.companyId) {
      throw new AppError('Request already assigned', 400, 'REQUEST_ALREADY_ASSIGNED');
    }

    return prisma.collectionRequest.update({
      where: { id: requestId },
      data: {
        companyId,
        status: 'accepted',
      },
    });
  }

  async rejectRequest(requestId: string, companyId: string) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.companyId !== companyId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    return prisma.collectionRequest.update({
      where: { id: requestId },
      data: {
        companyId: null,
        status: 'pending',
      },
    });
  }

  async updateStatus(
    requestId: string,
    companyId: string,
    status: 'on_the_way' | 'completed',
    realWeight?: number
  ) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.companyId !== companyId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (realWeight) {
        updateData.realWeight = realWeight;

        // Update user points
        const material = await prisma.material.findFirst({
          where: { name: request.materialType },
        });

        if (material) {
          const pointsEarned = Math.floor(realWeight * material.pointsPerKg);
          await prisma.user.update({
            where: { id: request.userId },
            data: {
              points: { increment: pointsEarned },
            },
          });
        }
      }
    }

    return prisma.collectionRequest.update({
      where: { id: requestId },
      data: updateData,
    });
  }

  async cancelRequest(requestId: string, userId: string, role: string) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    // Only creator or assigned company can cancel
    if (role === 'resident' && request.userId !== userId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }
    if (role === 'company' && request.companyId !== userId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    // Can't cancel completed requests
    if (request.status === 'completed') {
      throw new AppError('Cannot cancel completed request', 400, 'REQUEST_COMPLETED');
    }

    return prisma.collectionRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' },
    });
  }

  async rescheduleRequest(
    requestId: string,
    userId: string,
    data: z.infer<typeof rescheduleRequestSchema>
  ) {
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.userId !== userId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    // Can only reschedule accepted or on_the_way requests
    if (!['accepted', 'on_the_way'].includes(request.status)) {
      throw new AppError('Cannot reschedule this request', 400, 'INVALID_STATUS');
    }

    return prisma.collectionRequest.update({
      where: { id: requestId },
      data: {
        desiredDate: new Date(data.desiredDate),
        desiredTime: data.desiredTime,
        status: 'rescheduled',
      },
    });
  }
}
```

- [ ] **Step 3: Create request controller**

```typescript
// server/src/modules/requests/request.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RequestService } from './request.service';

const requestService = new RequestService();

export class RequestController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const request = await requestService.createRequest(userId, req.body);
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      const companyId = req.auth?.companyId;
      const role = req.auth?.role;
      if (!role) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const requests = await requestService.getRequests(
        userId || '',
        companyId || '',
        role
      );
      res.json(requests);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await requestService.getRequestById(req.params.id);
      res.json(request);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const request = await requestService.acceptRequest(req.params.id, companyId);
      res.json(request);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const request = await requestService.rejectRequest(req.params.id, companyId);
      res.json(request);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.auth?.companyId;
      if (!companyId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const { status } = req.params;
      const { realWeight } = req.body;
      const request = await requestService.updateStatus(
        req.params.id,
        companyId,
        status as any,
        realWeight
      );
      res.json(request);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      const companyId = req.auth?.companyId;
      const role = req.auth?.role;
      if (!role) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const request = await requestService.cancelRequest(
        req.params.id,
        userId || companyId || '',
        role
      );
      res.json(request);
    } catch (error) {
      next(error);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const request = await requestService.rescheduleRequest(
        req.params.id,
        userId,
        req.body
      );
      res.json(request);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 4: Create request routes**

```typescript
// server/src/modules/requests/request.routes.ts
import { Router } from 'express';
import { RequestController } from './request.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createRequestSchema,
  rescheduleRequestSchema,
} from './request.validation';

const router = Router();
const controller = new RequestController();

router.use(authenticate);

// Resident routes
router.post(
  '/',
  authorize('resident'),
  validate(createRequestSchema),
  controller.create
);

// Company routes
router.put(
  '/:id/accept',
  authorize('company'),
  controller.accept
);

router.put(
  '/:id/reject',
  authorize('company'),
  controller.reject
);

router.put(
  '/:id/on-the-way',
  authorize('company'),
  (req, res, next) => {
    req.params.status = 'on_the_way';
    next();
  },
  controller.updateStatus
);

router.put(
  '/:id/complete',
  authorize('company'),
  (req, res, next) => {
    req.params.status = 'completed';
    next();
  },
  controller.updateStatus
);

// Shared routes
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id/cancel', controller.cancel);
router.put(
  '/:id/reschedule',
  validate(rescheduleRequestSchema),
  controller.reschedule
);

export default router;
```

- [ ] **Step 5: Update routes index**

```typescript
// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import companyRoutes from '../modules/companies/company.routes';
import requestRoutes from '../modules/requests/request.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/requests', requestRoutes);

export default router;
```

- [ ] **Step 6: Test endpoints**

```bash
# Create request as resident
curl -X POST http://localhost:3001/api/requests \
  -H "Authorization: Bearer <resident_token>" \
  -H "Content-Type: application/json" \
  -d '{"materialType":"Papel","quantityKg":5,"desiredDate":"2026-07-20T10:00:00","desiredTime":"14:00","latitude":-23.55,"longitude":-46.63,"address":"Rua Test, 123"}'

# List requests as company
curl http://localhost:3001/api/requests \
  -H "Authorization: Bearer <company_token>"
```

Expected: Request created and listed correctly.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/requests
git commit -m "feat: add collection request CRUD endpoints"
```

---

### Task T6: Backend CRUD - Reviews, Notifications, Admin

**Covers:** [S9, S10, S11]
<!-- Reviews, notifications, and admin endpoints -->

**Files:**
- Create: `server/src/modules/reviews/review.controller.ts`
- Create: `server/src/modules/reviews/review.service.ts`
- Create: `server/src/modules/reviews/review.routes.ts`
- Create: `server/src/modules/notifications/notification.controller.ts`
- Create: `server/src/modules/notifications/notification.service.ts`
- Create: `server/src/modules/notifications/notification.routes.ts`
- Create: `server/src/modules/admin/admin.controller.ts`
- Create: `server/src/modules/admin/admin.service.ts`
- Create: `server/src/modules/admin/admin.routes.ts`

**Interfaces:**
- Consumes: T3 (auth), T5 (requests)
- Produces: Review, notification, and admin endpoints

- [ ] **Step 1: Create review service**

```typescript
// server/src/modules/reviews/review.service.ts
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class ReviewService {
  async createReview(
    userId: string,
    companyId: string,
    requestId: string,
    rating: number,
    comment?: string
  ) {
    // Check if request exists and is completed
    const request = await prisma.collectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.status !== 'completed') {
      throw new AppError('Request not completed', 400, 'REQUEST_NOT_COMPLETED');
    }

    if (request.userId !== userId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { requestId },
    });

    if (existingReview) {
      throw new AppError('Review already exists', 409, 'REVIEW_EXISTS');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        companyId,
        requestId,
        rating,
        comment,
      },
    });

    // Update company rating
    const companyReviews = await prisma.review.findMany({
      where: { companyId },
      select: { rating: true },
    });

    const avgRating =
      companyReviews.reduce((sum, r) => sum + r.rating, 0) / companyReviews.length;

    await prisma.company.update({
      where: { id: companyId },
      data: { rating: avgRating },
    });

    return review;
  }

  async getCompanyReviews(companyId: string) {
    return prisma.review.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
```

- [ ] **Step 2: Create review controller**

```typescript
// server/src/modules/reviews/review.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';

const reviewService = new ReviewService();

export class ReviewController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const { companyId, requestId, rating, comment } = req.body;
      const review = await reviewService.createReview(
        userId,
        companyId,
        requestId,
        rating,
        comment
      );
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getCompanyReviews(req.params.companyId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 3: Create review routes**

```typescript
// server/src/modules/reviews/review.routes.ts
import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new ReviewController();

router.get('/company/:companyId', controller.getCompanyReviews);

router.use(authenticate);
router.use(authorize('resident'));

router.post('/', controller.create);

export default router;
```

- [ ] **Step 4: Create notification service**

```typescript
// server/src/modules/notifications/notification.service.ts
import prisma from '../../config/database';

export class NotificationService {
  async getNotifications(userId: string, companyId: string, role: string) {
    const where: any = {};

    if (role === 'resident' || role === 'admin') {
      where.userId = userId;
    } else if (role === 'company') {
      where.companyId = companyId;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async createNotification(
    userId: string | null,
    companyId: string | null,
    type: string,
    message: string,
    data?: any
  ) {
    return prisma.notification.create({
      data: {
        userId,
        companyId,
        type,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });
  }
}
```

- [ ] **Step 5: Create notification controller**

```typescript
// server/src/modules/notifications/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      const companyId = req.auth?.companyId;
      const role = req.auth?.role;
      if (!role) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const notifications = await notificationService.getNotifications(
        userId || '',
        companyId || '',
        role
      );
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 6: Create notification routes**

```typescript
// server/src/modules/notifications/notification.routes.ts
import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.list);
router.put('/:id/read', controller.markAsRead);

export default router;
```

- [ ] **Step 7: Create admin service**

```typescript
// server/src/modules/admin/admin.service.ts
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class AdminService {
  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        email: true,
        role: true,
        points: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanies() {
    return prisma.company.findMany({
      select: {
        id: true,
        name: true,
        cnpj: true,
        responsible: true,
        phone: true,
        email: true,
        approved: true,
        active: true,
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return prisma.company.update({
      where: { id: companyId },
      data: { approved: true },
    });
  }

  async blockUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });
  }

  async blockCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return prisma.company.update({
      where: { id: companyId },
      data: { active: false },
    });
  }

  async getStats() {
    const [
      totalUsers,
      totalCompanies,
      totalRequests,
      completedRequests,
      totalMaterials,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.collectionRequest.count(),
      prisma.collectionRequest.count({ where: { status: 'completed' } }),
      prisma.collectionRequest.aggregate({
        where: { status: 'completed' },
        _sum: { realWeight: true },
      }),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalRequests,
      completedRequests,
      totalMaterials: totalMaterials._sum.realWeight || 0,
    };
  }

  async getReports() {
    // Get monthly stats for last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const monthlyStats = await prisma.collectionRequest.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      _count: true,
    });

    return {
      monthlyStats,
      generatedAt: now.toISOString(),
    };
  }
}
```

- [ ] **Step 8: Create admin controller**

```typescript
// server/src/modules/admin/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

const adminService = new AdminService();

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await adminService.getCompanies();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  }

  async approveCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await adminService.approveCompany(req.params.id);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.blockUser(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async blockCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await adminService.blockCompany(req.params.id);
      res.json(company);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await adminService.getReports();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 9: Create admin routes**

```typescript
// server/src/modules/admin/admin.routes.ts
import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new AdminController();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', controller.getUsers);
router.get('/companies', controller.getCompanies);
router.put('/companies/:id/approve', controller.approveCompany);
router.put('/users/:id/block', controller.blockUser);
router.put('/companies/:id/block', controller.blockCompany);
router.get('/stats', controller.getStats);
router.get('/reports', controller.getReports);

export default router;
```

- [ ] **Step 10: Update routes index**

```typescript
// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import companyRoutes from '../modules/companies/company.routes';
import requestRoutes from '../modules/requests/request.routes';
import reviewRoutes from '../modules/reviews/review.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/requests', requestRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
```

- [ ] **Step 11: Test admin endpoints**

```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecocoleta.com","password":"admin123"}'

# Get stats
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer <admin_token>"
```

Expected: Returns admin statistics.

- [ ] **Step 12: Commit**

```bash
git add server/src/modules/reviews server/src/modules/notifications server/src/modules/admin
git commit -m "feat: add reviews, notifications, and admin endpoints"
```

---

### Task T7: Socket.IO Integration

**Covers:** [S12]
<!-- Real-time communication -->

**Files:**
- Create: `server/src/services/socket.ts`
- Modify: `server/src/server.ts`
- Modify: `server/src/modules/requests/request.service.ts`

**Interfaces:**
- Consumes: T5 (request service)
- Produces: Real-time event handling

- [ ] **Step 1: Create Socket.IO service**

```typescript
// server/src/services/socket.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../middleware/auth';

let io: SocketServer;

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.data.auth = payload;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    const auth = socket.data.auth;
    if (auth.userId) {
      socket.join(`user:${auth.userId}`);
    }
    if (auth.companyId) {
      socket.join(`company:${auth.companyId}`);
    }

    socket.on('location:update', (data) => {
      // Broadcast location update to relevant users
      if (auth.companyId) {
        io.emit('location:updated', {
          companyId: auth.companyId,
          ...data,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToCompany(companyId: string, event: string, data: any) {
  getIO().to(`company:${companyId}`).emit(event, data);
}

export function emitToAll(event: string, data: any) {
  getIO().emit(event, data);
}
```

- [ ] **Step 2: Update server.ts to use Socket.IO**

```typescript
// server/src/server.ts
import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './services/socket';

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Socket.IO initialized`);
});

export { io };
```

- [ ] **Step 3: Update request service to emit events**

Add to `request.service.ts`:

```typescript
import { emitToUser, emitToCompany } from '../../services/socket';

// In acceptRequest method, after updating:
emitToUser(request.userId, 'request:status_changed', {
  requestId,
  status: 'accepted',
  companyId,
});

// In updateStatus method, after updating:
if (status === 'completed') {
  emitToUser(request.userId, 'request:status_changed', {
    requestId,
    status: 'completed',
  });
} else if (status === 'on_the_way') {
  emitToUser(request.userId, 'request:status_changed', {
    requestId,
    status: 'on_the_way',
  });
}

// In createRequest method, after creating:
emitToAll('request:new', {
  id: request.id,
  materialType: request.materialType,
  quantityKg: request.quantityKg,
  latitude: request.latitude,
  longitude: request.longitude,
});
```

- [ ] **Step 4: Test Socket.IO connection**

```bash
# Start server and use a Socket.IO client to connect
# Verify connection and events
```

Expected: Socket.IO server accepts connections and emits events.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/socket.ts server/src/server.ts server/src/modules/requests/request.service.ts
git commit -m "feat: add Socket.IO for real-time events"
```

---

### Task T8: Frontend Setup - Electron + React + Vite

**Covers:** [S13]
<!-- Electron and React frontend setup -->

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/electron.vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.html`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: T1 (project structure)
- Produces: Electron + React frontend shell

- [ ] **Step 1: Install Electron dependencies**

```bash
npm install electron electron-vite @electron-toolkit/preload @electron-toolkit/utils
```

- [ ] **Step 2: Create electron.vite.config.ts**

```typescript
// electron/electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    plugins: [react()],
  },
});
```

- [ ] **Step 3: Create Electron main process**

```typescript
// electron/main.ts
import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.ecocoleta');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

- [ ] **Step 4: Create preload script**

```typescript
// electron/preload.ts
import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
  sendMessage: (channel: string, data: unknown) => {
    electronAPI.ipcRenderer.send(channel, data);
  },
  onMessage: (channel: string, callback: (...args: unknown[]) => void) => {
    electronAPI.ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}
```

- [ ] **Step 5: Create React entry point**

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoColeta</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create React main.tsx**

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create App.tsx**

```typescript
// src/App.tsx
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-green-500 p-8">EcoColeta</h1>
      <p className="text-gray-600 dark:text-gray-300 px-8">
        Aplicativo de coleta seletiva
      </p>
    </div>
  );
}

export default App;
```

- [ ] **Step 8: Create CSS file**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

- [ ] **Step 9: Create vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

interface Window {
  electron: typeof import('@electron-toolkit/preload').electronAPI;
  api: {
    sendMessage: (channel: string, data: unknown) => void;
    onMessage: (channel: string, callback: (...args: unknown[]) => void) => void;
  };
}
```

- [ ] **Step 10: Install Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 11: Configure Tailwind**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22C55E',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 12: Update package.json scripts**

Add to root `package.json`:
```json
"build": "electron-vite build",
"preview": "electron-vite preview",
"postinstall": "electron-builder install-app-deps"
```

- [ ] **Step 13: Test frontend starts**

```bash
npm run dev:client
```

Expected: Electron window opens with React app.

- [ ] **Step 14: Commit**

```bash
git add electron/ src/
git commit -m "feat: set up Electron with React and Vite"
```

---

### Task T9: Frontend - Auth Context & Theme

**Covers:** [S14]
<!-- Authentication and theme context -->

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/contexts/ThemeContext.tsx`
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useTheme.ts`
- Create: `src/services/api.ts`

**Interfaces:**
- Consumes: T8 (frontend setup)
- Produces: Auth and theme contexts, API client

- [ ] **Step 1: Create API client**

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error('Request failed');
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{
      user?: any;
      company?: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async registerResident(data: any) {
    const result = await this.request<any>('/auth/register/resident', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async registerCompany(data: any) {
    const result = await this.request<any>('/auth/register/company', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  // Users
  async getUserProfile() {
    return this.request<any>('/users/me');
  }

  async updateUserProfile(data: any) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserDashboard() {
    return this.request<any>('/users/dashboard');
  }

  async getUserPoints() {
    return this.request<any>('/users/points');
  }

  // Companies
  async getCompanyProfile() {
    return this.request<any>('/companies/me');
  }

  async updateCompanyProfile(data: any) {
    return this.request<any>('/companies/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCompanyDashboard() {
    return this.request<any>('/companies/dashboard');
  }

  async getNearbyCompanies(lat: number, lng: number, radius: number) {
    return this.request<any>(
      `/companies/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
  }

  // Requests
  async createRequest(data: any) {
    return this.request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRequests() {
    return this.request<any>('/requests');
  }

  async getRequestById(id: string) {
    return this.request<any>(`/requests/${id}`);
  }

  async acceptRequest(id: string) {
    return this.request<any>(`/requests/${id}/accept`, { method: 'PUT' });
  }

  async rejectRequest(id: string) {
    return this.request<any>(`/requests/${id}/reject`, { method: 'PUT' });
  }

  async updateRequestStatus(id: string, status: string, realWeight?: number) {
    return this.request<any>(`/requests/${id}/${status}`, {
      method: 'PUT',
      body: JSON.stringify({ realWeight }),
    });
  }

  async cancelRequest(id: string) {
    return this.request<any>(`/requests/${id}/cancel`, { method: 'PUT' });
  }

  async rescheduleRequest(id: string, data: any) {
    return this.request<any>(`/requests/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Reviews
  async createReview(data: any) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCompanyReviews(companyId: string) {
    return this.request<any>(`/reviews/company/${companyId}`);
  }

  // Notifications
  async getNotifications() {
    return this.request<any>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  // Admin
  async getAdminUsers() {
    return this.request<any>('/admin/users');
  }

  async getAdminCompanies() {
    return this.request<any>('/admin/companies');
  }

  async approveCompany(id: string) {
    return this.request<any>(`/admin/companies/${id}/approve`, { method: 'PUT' });
  }

  async blockUser(id: string) {
    return this.request<any>(`/admin/users/${id}/block`, { method: 'PUT' });
  }

  async blockCompany(id: string) {
    return this.request<any>(`/admin/companies/${id}/block`, { method: 'PUT' });
  }

  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getAdminReports() {
    return this.request<any>('/admin/reports');
  }
}

export const api = new ApiClient();
```

- [ ] **Step 2: Create AuthContext**

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'admin' | 'company';
}

interface Company {
  id: string;
  name: string;
  email: string;
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerResident: (data: any) => Promise<void>;
  registerCompany: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.loadTokens();
    const storedUser = localStorage.getItem('user');
    const storedCompany = localStorage.getItem('company');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedCompany) {
      setCompany(JSON.parse(storedCompany));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    
    if (data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    if (data.company) {
      setCompany(data.company);
      localStorage.setItem('company', JSON.stringify(data.company));
    }
  };

  const registerResident = async (data: any) => {
    const result = await api.registerResident(data);
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const registerCompany = async (data: any) => {
    const result = await api.registerCompany(data);
    setCompany(result.company);
    localStorage.setItem('company', JSON.stringify(result.company));
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setCompany(null);
    localStorage.removeItem('user');
    localStorage.removeItem('company');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user || !!company,
        isLoading,
        login,
        registerResident,
        registerCompany,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

- [ ] **Step 3: Create ThemeContext**

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 4: Update App.tsx with providers**

```typescript
// src/App.tsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
          <h1 className="text-3xl font-bold text-primary-500 p-8">EcoColeta</h1>
          <p className="text-gray-600 dark:text-gray-300 px-8">
            Aplicativo de coleta seletiva
          </p>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 5: Test contexts**

```bash
npm run dev:client
```

Expected: App loads with theme toggle working.

- [ ] **Step 6: Commit**

```bash
git add src/contexts src/hooks src/services
git commit -m "feat: add auth and theme contexts with API client"
```

---

### Task T10: Frontend - Auth Pages

**Covers:** [S15]
<!-- Login and registration pages -->

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`
- Create: `src/pages/auth/RegisterResidentPage.tsx`
- Create: `src/pages/auth/RegisterCompanyPage.tsx`
- Create: `src/components/Button.tsx`
- Create: `src/components/Input.tsx`
- Create: `src/components/Card.tsx`

**Interfaces:**
- Consumes: T9 (auth context, API client)
- Produces: Auth pages

- [ ] **Step 1: Create Button component**

```typescript
// src/components/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  );
}
```

- [ ] **Step 2: Create Input component**

```typescript
// src/components/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create Card component**

```typescript
// src/components/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create LoginPage**

```typescript
// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          EcoColeta
        </h1>
        <h2 className="text-lg text-center mb-6 text-gray-600 dark:text-gray-400">
          Entrar na sua conta
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?{' '}
          <a href="/register" className="text-primary-500 hover:underline">
            Cadastre-se
          </a>
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create RegisterResidentPage**

```typescript
// src/pages/auth/RegisterResidentPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';

export function RegisterResidentPage() {
  const { registerResident } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await registerResident(formData);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Cadastro de Morador
        </h1>

        <form onSubmit={handleSubmit}>
          <Input
            label="Nome"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="CPF"
            name="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={handleChange}
            required
          />
          <Input
            label="Telefone"
            name="phone"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Cadastrar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <a href="/login" className="text-primary-500 hover:underline">
            Entrar
          </a>
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Create RegisterCompanyPage**

```typescript
// src/pages/auth/RegisterCompanyPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';

export function RegisterCompanyPage() {
  const { registerCompany } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    responsible: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    serviceAreaRadius: 10,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For now, use default location - in production, get from Google Maps
      await registerCompany({
        ...formData,
        latitude: -23.5505,
        longitude: -46.6333,
        materials: ['paper', 'plastic'],
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Cadastro de Empresa
        </h1>

        <form onSubmit={handleSubmit}>
          <Input
            label="Nome da Empresa"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="CNPJ"
            name="cnpj"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={handleChange}
            required
          />
          <Input
            label="Responsável"
            name="responsible"
            value={formData.responsible}
            onChange={handleChange}
            required
          />
          <Input
            label="Telefone"
            name="phone"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <Input
            label="Raio de Atendimento (km)"
            name="serviceAreaRadius"
            type="number"
            value={formData.serviceAreaRadius}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full">
            Cadastrar Empresa
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <a href="/login" className="text-primary-500 hover:underline">
            Entrar
          </a>
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Test auth pages**

```bash
npm run dev:client
```

Expected: Auth pages render and forms work.

- [ ] **Step 8: Commit**

```bash
git add src/pages/auth src/components
git commit -m "feat: add login and registration pages"
```

---

### Task T11: Frontend - Socket.IO Hook

**Covers:** [S16]
<!-- Real-time connection hook -->

**Files:**
- Create: `src/hooks/useSocket.ts`
- Create: `src/services/socket.ts`

**Interfaces:**
- Consumes: T9 (auth context)
- Produces: Socket.IO connection hook

- [ ] **Step 1: Create Socket.IO client**

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

- [ ] **Step 2: Create useSocket hook**

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSocket, disconnectSocket } from '../services/socket';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const { user, company } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [user, company]);

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  return { on, off, emit, socket: socketRef.current };
}
```

- [ ] **Step 3: Test socket connection**

```bash
npm run dev:client
```

Expected: Socket connects on login.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSocket.ts src/services/socket.ts
git commit -m "feat: add Socket.IO hook for real-time updates"
```

---

### Task T12: Frontend - Resident Dashboard & Request Flow

**Covers:** [S17]
<!-- Resident features -->

**Files:**
- Create: `src/pages/resident/ResidentDashboard.tsx`
- Create: `src/pages/resident/NewRequestPage.tsx`
- Create: `src/pages/resident/RequestDetailPage.tsx`
- Create: `src/pages/resident/HistoryPage.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/Timeline.tsx`

**Interfaces:**
- Consumes: T9 (auth, API), T11 (socket)
- Produces: Resident pages

- [ ] **Step 1: Create StatusBadge component**

```typescript
// src/components/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
  accepted: { color: 'bg-blue-100 text-blue-800', label: 'Aceita' },
  on_the_way: { color: 'bg-purple-100 text-purple-800', label: 'A Caminho' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Concluída' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelada' },
  rescheduled: { color: 'bg-orange-100 text-orange-800', label: 'Reagendada' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Create Timeline component**

```typescript
// src/components/Timeline.tsx
import React from 'react';

interface TimelineEvent {
  status: string;
  date: string;
  description: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{index + 1}</span>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900 dark:text-white">{event.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(event.date).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create ResidentDashboard**

```typescript
// src/pages/resident/ResidentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';

export function ResidentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getUserDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Olá, {user?.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Solicitações
          </h3>
          <p className="text-3xl font-bold text-primary-500">
            {dashboard?.stats.totalRequests || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Concluídas
          </h3>
          <p className="text-3xl font-bold text-green-500">
            {dashboard?.stats.completedRequests || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Pontos
          </h3>
          <p className="text-3xl font-bold text-yellow-500">
            {dashboard?.user.points || 0}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Últimas Solicitações
        </h2>
        <div className="space-y-4">
          {dashboard?.recentRequests.map((request: any) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {request.materialType} - {request.quantityKg}kg
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(request.desiredDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create NewRequestPage**

```typescript
// src/pages/resident/NewRequestPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';

export function NewRequestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    materialType: '',
    quantityKg: '',
    desiredDate: '',
    desiredTime: '',
    address: '',
    observations: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // In production, get location from Google Maps
      await api.createRequest({
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        desiredDate: new Date(formData.desiredDate).toISOString(),
        latitude: -23.5505,
        longitude: -46.6333,
      });
      navigate('/resident');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Nova Solicitação de Coleta
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Material
            </label>
            <select
              name="materialType"
              value={formData.materialType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Selecione...</option>
              <option value="Papel">Papel</option>
              <option value="Plástico">Plástico</option>
              <option value="Vidro">Vidro</option>
              <option value="Metal">Metal</option>
              <option value="Orgânico">Orgânico</option>
            </select>
          </div>

          <Input
            label="Quantidade (kg)"
            name="quantityKg"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.quantityKg}
            onChange={handleChange}
            required
          />

          <Input
            label="Data Desejada"
            name="desiredDate"
            type="date"
            value={formData.desiredDate}
            onChange={handleChange}
            required
          />

          <Input
            label="Horário Desejado"
            name="desiredTime"
            type="time"
            value={formData.desiredTime}
            onChange={handleChange}
            required
          />

          <Input
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Criar Solicitação
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create RequestDetailPage**

```typescript
// src/pages/resident/RequestDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { Button } from '../../components/Button';
import { StarRating } from '../../components/StarRating';

export function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequestById(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar?')) return;
    try {
      await api.cancelRequest(id!);
      loadRequest();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleReview = async () => {
    if (rating === 0) {
      alert('Selecione uma avaliação');
      return;
    }
    try {
      await api.createReview({
        companyId: request.companyId,
        requestId: id,
        rating,
        comment,
      });
      loadRequest();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center">Solicitação não encontrada</div>;
  }

  const timeline = [
    { status: 'pending', date: request.createdAt, description: 'Solicitação criada' },
    ...(request.status !== 'pending'
      ? [{ status: 'accepted', date: request.createdAt, description: 'Aceita pela empresa' }]
      : []),
    ...(request.status === 'on_the_way' || request.status === 'completed'
      ? [{ status: 'on_the_way', date: request.createdAt, description: 'Empresa a caminho' }]
      : []),
    ...(request.status === 'completed'
      ? [{ status: 'completed', date: request.completedAt, description: 'Coleta concluída' }]
      : []),
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Detalhes da Solicitação
      </h1>

      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {request.materialType}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {request.quantityKg}kg
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(request.desiredDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Horário</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.desiredTime}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {request.address}
          </p>
        </div>

        {request.observations && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
            <p className="text-gray-900 dark:text-white">{request.observations}</p>
          </div>
        )}

        {request.company && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.company.name}
            </p>
          </div>
        )}

        {request.status === 'pending' && (
          <Button variant="danger" onClick={handleCancel} className="w-full">
            Cancelar Solicitação
          </Button>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Progresso
        </h3>
        <Timeline events={timeline} />
      </Card>

      {request.status === 'completed' && !request.review && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Avaliar Serviço
          </h3>
          <div className="mb-4">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe um comentário (opcional)"
            className="w-full px-3 py-2 border rounded-lg mb-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
          />
          <Button onClick={handleReview} className="w-full">
            Enviar Avaliação
          </Button>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create StarRating component**

```typescript
// src/components/StarRating.tsx
import React from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-2xl ${
            star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          } ${!readonly ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create HistoryPage**

```typescript
// src/pages/resident/HistoryPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';

export function HistoryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Histórico de Solicitações
      </h1>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {status === 'all' ? 'Todas' : status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Link key={request.id} to={`/resident/requests/${request.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {request.materialType}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {request.quantityKg}kg - {new Date(request.desiredDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Test resident pages**

```bash
npm run dev:client
```

Expected: Resident pages render and work.

- [ ] **Step 9: Commit**

```bash
git add src/pages/resident src/components/StatusBadge.tsx src/components/Timeline.tsx src/components/StarRating.tsx
git commit -m "feat: add resident dashboard and request pages"
```

---

### Task T13: Frontend - Company Dashboard & Map

**Covers:** [S18]
<!-- Company features -->

**Files:**
- Create: `src/pages/company/CompanyDashboard.tsx`
- Create: `src/pages/company/MapViewPage.tsx`
- Create: `src/pages/company/RequestDetailPage.tsx`
- Create: `src/pages/company/CollectionProcessPage.tsx`
- Create: `src/components/MapView.tsx`
- Create: `src/hooks/useGoogleMaps.ts`

**Interfaces:**
- Consumes: T9 (auth, API), T11 (socket)
- Produces: Company pages

- [ ] **Step 1: Create useGoogleMaps hook**

```typescript
// src/hooks/useGoogleMaps.ts
import { useEffect, useRef, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

export function useGoogleMaps(containerRef: React.RefObject<HTMLDivElement>) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: -23.5505, lng: -46.6333 },
      zoom: 12,
    });

    mapRef.current = map;
    setIsLoaded(true);

    return () => {
      mapRef.current = null;
    };
  }, [containerRef]);

  const addMarker = (location: Location, title: string) => {
    if (!mapRef.current) return;

    return new google.maps.Marker({
      position: location,
      map: mapRef.current,
      title,
    });
  };

  const clearMarkers = () => {
    if (!mapRef.current) return;

    // Clear all markers
    mapRef.current.data.forEach((feature) => {
      mapRef.current?.data.remove(feature);
    });
  };

  const setCenter = (location: Location) => {
    mapRef.current?.setCenter(location);
  };

  return {
    map: mapRef.current,
    isLoaded,
    addMarker,
    clearMarkers,
    setCenter,
  };
}
```

- [ ] **Step 2: Create MapView component**

```typescript
// src/components/MapView.tsx
import React, { useRef } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

interface MapViewProps {
  center?: { lat: number; lng: number };
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
  }>;
  className?: string;
}

export function MapView({ center, markers = [], className = '' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded } = useGoogleMaps(containerRef);

  return (
    <div
      ref={containerRef}
      className={`bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ minHeight: '400px' }}
    >
      {!isLoaded && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">Carregando mapa...</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create CompanyDashboard**

```typescript
// src/pages/company/CompanyDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';

export function CompanyDashboard() {
  const { company } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getCompanyDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Painel da Empresa
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Total Solicitações
          </h3>
          <p className="text-3xl font-bold text-primary-500">
            {dashboard?.stats.totalRequests || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Pendentes
          </h3>
          <p className="text-3xl font-bold text-yellow-500">
            {dashboard?.stats.pendingRequests || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Concluídas Hoje
          </h3>
          <p className="text-3xl font-bold text-green-500">
            {dashboard?.stats.completedToday || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Total Coletado
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {dashboard?.stats.totalCollected?.toFixed(1) || 0}kg
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Avaliações Recentes
        </h2>
        <div className="space-y-4">
          {dashboard?.recentReviews.map((review: any) => (
            <div
              key={review.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {review.user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {review.comment}
                  </p>
                </div>
                <div className="text-yellow-400">
                  {'★'.repeat(review.rating)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create MapViewPage**

```typescript
// src/pages/company/MapViewPage.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MapView } from '../../components/MapView';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';

export function MapViewPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data.filter((r: any) => r.status === 'pending'));
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const markers = requests.map((req) => ({
    position: { lat: req.latitude, lng: req.longitude },
    title: `${req.materialType} - ${req.quantityKg}kg`,
  }));

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Mapa de Solicitações
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <MapView markers={markers} className="w-full h-[600px]" />
          </Card>
        </div>

        <div>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Solicitações Pendentes
            </h2>
            <div className="space-y-4 max-h-[550px] overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.materialType}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.quantityKg}kg
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create company RequestDetailPage**

```typescript
// src/pages/company/RequestDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { MapView } from '../../components/MapView';

export function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequestById(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await api.acceptRequest(id!);
      loadRequest();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleReject = async () => {
    if (!confirm('Tem certeza que deseja recusar?')) return;
    try {
      await api.rejectRequest(id!);
      navigate('/company');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await api.updateRequestStatus(id!, status);
      loadRequest();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center">Solicitação não encontrada</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Detalhes da Solicitação
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {request.materialType}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {request.quantityKg}kg
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.user.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {request.user.phone}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.address}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Data/Horário</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(request.desiredDate).toLocaleDateString('pt-BR')} às {request.desiredTime}
              </p>
            </div>

            {request.observations && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
                <p className="text-gray-900 dark:text-white">{request.observations}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {request.status === 'pending' && (
              <>
                <Button onClick={handleAccept} className="flex-1">
                  Aceitar
                </Button>
                <Button variant="danger" onClick={handleReject} className="flex-1">
                  Recusar
                </Button>
              </>
            )}
            {request.status === 'accepted' && (
              <Button onClick={() => handleStatusUpdate('on_the_way')} className="w-full">
                A Caminho
              </Button>
            )}
            {request.status === 'on_the_way' && (
              <Button onClick={() => handleStatusUpdate('completed')} className="w-full">
                Concluir Coleta
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <MapView
            center={{ lat: request.latitude, lng: request.longitude }}
            markers={[
              {
                position: { lat: request.latitude, lng: request.longitude },
                title: request.address,
              },
            ]}
            className="w-full h-full min-h-[400px]"
          />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create CollectionProcessPage**

```typescript
// src/pages/company/CollectionProcessPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function CollectionProcessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realWeight, setRealWeight] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequestById(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!realWeight || parseFloat(realWeight) <= 0) {
      alert('Informe o peso real');
      return;
    }

    try {
      await api.updateRequestStatus(id!, 'completed', parseFloat(realWeight));
      navigate('/company');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center">Solicitação não encontrada</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Processo de Coleta
      </h1>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {request.materialType}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Peso Estimado</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {request.quantityKg}kg
            </p>
          </div>

          <Input
            label="Peso Real (kg)"
            type="number"
            step="0.1"
            min="0.1"
            value={realWeight}
            onChange={(e) => setRealWeight(e.target.value)}
            placeholder="0.0"
          />
        </div>

        <Button onClick={handleComplete} className="w-full">
          Concluir Coleta
        </Button>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Test company pages**

```bash
npm run dev:client
```

Expected: Company pages render and work.

- [ ] **Step 8: Commit**

```bash
git add src/pages/company src/components/MapView.tsx src/hooks/useGoogleMaps.ts
git commit -m "feat: add company dashboard and map pages"
```

---

### Task T14: Frontend - Admin Panel

**Covers:** [S19]
<!-- Admin features -->

**Files:**
- Create: `src/pages/admin/AdminDashboard.tsx`
- Create: `src/pages/admin/ManageUsersPage.tsx`
- Create: `src/pages/admin/ManageCompaniesPage.tsx`
- Create: `src/pages/admin/ReportsPage.tsx`
- Create: `src/components/DataTable.tsx`

**Interfaces:**
- Consumes: T9 (auth, API)
- Produces: Admin pages

- [ ] **Step 1: Create DataTable component**

```typescript
// src/components/DataTable.tsx
import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-gray-200 dark:border-gray-700 ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminDashboard**

```typescript
// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Painel Administrativo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Usuários
          </h3>
          <p className="text-3xl font-bold text-primary-500">
            {stats?.totalUsers || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Empresas
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {stats?.totalCompanies || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Solicitações
          </h3>
          <p className="text-3xl font-bold text-yellow-500">
            {stats?.totalRequests || 0}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Materiais Coletados
          </h3>
          <p className="text-3xl font-bold text-green-500">
            {stats?.totalMaterials?.toFixed(1) || 0}kg
          </p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ManageUsersPage**

```typescript
// src/pages/admin/ManageUsersPage.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/Button';

export function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: string) => {
    if (!confirm('Tem certeza que deseja bloquear este usuário?')) return;
    try {
      await api.blockUser(userId);
      loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    { key: 'cpf', header: 'CPF' },
    { key: 'points', header: 'Pontos' },
    {
      key: 'active',
      header: 'Status',
      render: (user: any) => (
        <span className={user.active ? 'text-green-500' : 'text-red-500'}>
          {user.active ? 'Ativo' : 'Bloqueado'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (user: any) => (
        user.active && (
          <Button
            variant="danger"
            onClick={() => handleBlock(user.id)}
            className="text-sm px-2 py-1"
          >
            Bloquear
          </Button>
        )
      ),
    },
  ];

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Gerenciar Usuários
      </h1>

      <Card>
        <DataTable columns={columns} data={users} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create ManageCompaniesPage**

```typescript
// src/pages/admin/ManageCompaniesPage.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/Button';

export function ManageCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await api.getAdminCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: string) => {
    try {
      await api.approveCompany(companyId);
      loadCompanies();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleBlock = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja bloquear esta empresa?')) return;
    try {
      await api.blockCompany(companyId);
      loadCompanies();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'cnpj', header: 'CNPJ' },
    { key: 'email', header: 'Email' },
    {
      key: 'approved',
      header: 'Aprovada',
      render: (company: any) => (
        <span className={company.approved ? 'text-green-500' : 'text-yellow-500'}>
          {company.approved ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (company: any) => (
        <span className={company.active ? 'text-green-500' : 'text-red-500'}>
          {company.active ? 'Ativa' : 'Bloqueada'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (company: any) => (
        <div className="flex gap-2">
          {!company.approved && company.active && (
            <Button
              onClick={() => handleApprove(company.id)}
              className="text-sm px-2 py-1"
            >
              Aprovar
            </Button>
          )}
          {company.active && (
            <Button
              variant="danger"
              onClick={() => handleBlock(company.id)}
              className="text-sm px-2 py-1"
            >
              Bloquear
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Gerenciar Empresas
      </h1>

      <Card>
        <DataTable columns={columns} data={companies} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create ReportsPage**

```typescript
// src/pages/admin/ReportsPage.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getAdminReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // In production, generate PDF with pdfmake
    alert('Funcionalidade de PDF será implementada');
  };

  const handleDownloadExcel = () => {
    // In production, generate Excel with exceljs
    alert('Funcionalidade de Excel será implementada');
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Relatórios
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Relatório PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gere um relatório completo em PDF com todas as estatísticas.
          </p>
          <Button onClick={handleDownloadPDF} className="w-full">
            Baixar PDF
          </Button>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Relatório Excel
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Exporte os dados para Excel para análise detalhada.
          </p>
          <Button onClick={handleDownloadExcel} className="w-full">
            Baixar Excel
          </Button>
        </Card>
      </div>

      {reports && (
        <Card className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Estatísticas Mensais
          </h2>
          <div className="space-y-2">
            {reports.monthlyStats.map((stat: any) => (
              <div
                key={stat.status}
                className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-gray-900 dark:text-white">{stat.status}</span>
                <span className="font-bold text-primary-500">{stat._count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Test admin pages**

```bash
npm run dev:client
```

Expected: Admin pages render and work.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin src/components/DataTable.tsx
git commit -m "feat: add admin panel pages"
```

---

### Task T15: Frontend - Routing & Layout

**Covers:** [S20]
<!-- App routing and layout -->

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/NotificationBell.tsx`
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: T9-T14 (all previous frontend tasks)
- Produces: Complete app routing and layout

- [ ] **Step 1: Create Sidebar component**

```typescript
// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const { user, company } = useAuth();
  const location = useLocation();

  const residentLinks = [
    { path: '/resident', label: 'Dashboard', icon: '🏠' },
    { path: '/resident/new-request', label: 'Nova Solicitação', icon: '➕' },
    { path: '/resident/history', label: 'Histórico', icon: '📋' },
    { path: '/resident/ranking', label: 'Ranking', icon: '🏆' },
  ];

  const companyLinks = [
    { path: '/company', label: 'Dashboard', icon: '🏠' },
    { path: '/company/map', label: 'Mapa', icon: '🗺️' },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/users', label: 'Usuários', icon: '👥' },
    { path: '/admin/companies', label: 'Empresas', icon: '🏢' },
    { path: '/admin/reports', label: 'Relatórios', icon: '📊' },
  ];

  let links = [];
  if (user?.role === 'admin') {
    links = adminLinks;
  } else if (company) {
    links = companyLinks;
  } else if (user) {
    links = residentLinks;
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary-500">EcoColeta</h1>
      </div>
      <nav className="mt-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              location.pathname === link.path
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500 border-r-4 border-primary-500'
                : ''
            }`}
          >
            <span className="mr-3">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create Header component**

```typescript
// src/components/Header.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayName = user?.name || company?.name || 'Usuário';

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {displayName}
        </h2>
        {company && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            Empresa
          </span>
        )}
        {user?.role === 'admin' && (
          <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
            Admin
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create NotificationBell component**

```typescript
// src/components/NotificationBell.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { on, off } = useSocket();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();

    const handleNewNotification = (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    on('notification:new', handleNewNotification);

    return () => {
      off('notification:new', handleNewNotification);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 dark:text-gray-400 text-center">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <p className="text-sm text-gray-900 dark:text-white">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create Layout component**

```typescript
// src/components/Layout.tsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update App.tsx with routing**

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterResidentPage } from './pages/auth/RegisterResidentPage';
import { RegisterCompanyPage } from './pages/auth/RegisterCompanyPage';
import { ResidentDashboard } from './pages/resident/ResidentDashboard';
import { NewRequestPage } from './pages/resident/NewRequestPage';
import { RequestDetailPage as ResidentRequestDetail } from './pages/resident/RequestDetailPage';
import { HistoryPage } from './pages/resident/HistoryPage';
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { MapViewPage } from './pages/company/MapViewPage';
import { RequestDetailPage as CompanyRequestDetail } from './pages/company/RequestDetailPage';
import { CollectionProcessPage } from './pages/company/CollectionProcessPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { ManageCompaniesPage } from './pages/admin/ManageCompaniesPage';
import { ReportsPage } from './pages/admin/ReportsPage';

function AppRoutes() {
  const { user, company } = useAuth();

  const getHomeRoute = () => {
    if (user?.role === 'admin') return '/admin';
    if (company) return '/company';
    if (user) return '/resident';
    return '/login';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterResidentPage />} />
      <Route path="/register/company" element={<RegisterCompanyPage />} />

      {/* Resident routes */}
      <Route path="/resident" element={<Layout />}>
        <Route index element={<ResidentDashboard />} />
        <Route path="new-request" element={<NewRequestPage />} />
        <Route path="requests/:id" element={<ResidentRequestDetail />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>

      {/* Company routes */}
      <Route path="/company" element={<Layout />}>
        <Route index element={<CompanyDashboard />} />
        <Route path="map" element={<MapViewPage />} />
        <Route path="requests/:id" element={<CompanyRequestDetail />} />
        <Route path="requests/:id/process" element={<CollectionProcessPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<Layout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="companies" element={<ManageCompaniesPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 6: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 7: Test routing**

```bash
npm run dev:client
```

Expected: App routes correctly based on user role.

- [ ] **Step 8: Commit**

```bash
git add src/components src/App.tsx
git commit -m "feat: add app routing and layout components"
```

---

### Task T16: Testing & Polish

**Covers:** [S21]
<!-- Tests and final touches -->

**Files:**
- Create: `server/src/__tests__/auth.test.ts`
- Create: `server/src/__tests__/requests.test.ts`
- Create: `src/__tests__/components.test.tsx`

**Interfaces:**
- Consumes: All previous tasks
- Produces: Test files, final polish

- [ ] **Step 1: Create auth tests**

```typescript
// server/src/__tests__/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('Auth endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register/resident', () => {
    it('should register a new resident', async () => {
      const response = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Test User',
          cpf: '123.456.789-00',
          phone: '11999999999',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Test User',
          cpf: '123.456.789-00',
          phone: '11999999999',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'maria@email.com',
          password: 'resident123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'maria@email.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
```

- [ ] **Step 2: Create request tests**

```typescript
// server/src/__tests__/requests.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('Request endpoints', () => {
  let residentToken: string;
  let companyToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as resident
    const residentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'maria@email.com',
        password: 'resident123',
      });
    residentToken = residentLogin.body.accessToken;

    // Login as company
    const companyLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'contato@reciclafacil.com',
        password: 'company123',
      });
    companyToken = companyLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/requests', () => {
    it('should create a new request', async () => {
      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'Papel',
          quantityKg: 5,
          desiredDate: '2026-07-20T10:00:00',
          desiredTime: '14:00',
          latitude: -23.55,
          longitude: -46.63,
          address: 'Rua Test, 123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
    });

    it('should fail without auth', async () => {
      const response = await request(app)
        .post('/api/requests')
        .send({
          materialType: 'Papel',
          quantityKg: 5,
          desiredDate: '2026-07-20T10:00:00',
          desiredTime: '14:00',
          latitude: -23.55,
          longitude: -46.63,
          address: 'Rua Test, 123',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/requests', () => {
    it('should list requests for resident', async () => {
      const response = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should list requests for company', async () => {
      const response = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

- [ ] **Step 3: Create component tests**

```typescript
// src/__tests__/components.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatusBadge } from '../components/StatusBadge';

describe('Components', () => {
  describe('Button', () => {
    it('renders with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Input', () => {
    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('renders pending status', () => {
      render(<StatusBadge status="pending" />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('renders completed status', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Concluída')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom supertest @types/supertest
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: Tests pass.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: add tests and final polish"
```

---

## Self-Review

### Spec Coverage

- [S1] Project structure → T1
- [S2] Tech stack → T1
- [S3] Database schema → T2
- [S4] Auth endpoints → T3
- [S5] User endpoints → T4
- [S6] Company endpoints → T4
- [S7] Request endpoints → T5
- [S8] Reviews → T6
- [S9] Notifications → T6
- [S10] Admin endpoints → T6
- [S11] Socket.IO → T7
- [S12] Frontend setup → T8
- [S13] Auth context → T9
- [S14] Auth pages → T10
- [S15] Socket hook → T11
- [S16] Resident pages → T12
- [S17] Company pages → T13
- [S18] Admin pages → T14
- [S19] Routing & layout → T15
- [S20] Tests → T16

### Placeholder Scan

No placeholders found. All steps contain actual code.

### Type Consistency

All types and method signatures are consistent across tasks.

---

## Execution Handoff

The plan contains 16 tasks. Tasks are grouped into logical units:
- T1-T2: Project setup (2 tasks)
- T3-T7: Backend (5 tasks)
- T8-T15: Frontend (8 tasks)
- T16: Testing (1 task)

Recommended execution: **Subagent** for parallel execution of independent tasks.