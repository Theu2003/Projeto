import crypto from 'crypto';
import { PrismaClient, User, Company } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';
import { AppError } from '@/middleware/errorHandler';
import { RegisterResidentInput, RegisterCompanyInput, LoginInput, GoogleLoginInput } from './auth.validation';

const prisma = new PrismaClient();

interface AuthResult {
  user?: Omit<User, 'passwordHash'>;
  company?: Omit<Company, 'passwordHash'>;
  token: string;
  refreshToken: string;
}

function generateTokens(userId: string, role: string) {
  const signOptions: jwt.SignOptions = { expiresIn: 60 * 60 * 24 * 7 };
  const token = jwt.sign({ userId, role }, config.jwtSecret, signOptions);

  const refreshOptions: jwt.SignOptions = { expiresIn: 60 * 60 * 24 * 30 };
  const refreshToken = jwt.sign({ userId, role, type: 'refresh' }, config.jwtSecret, refreshOptions);

  return { token, refreshToken };
}

function excludePassword<T extends { passwordHash: string }>(obj: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = obj;
  return rest;
}

export async function registerResident(data: RegisterResidentInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
  });

  if (existingUser) {
    throw new AppError('User already exists with this email or CPF', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email,
      passwordHash,
      role: 'resident',
    },
  });

  const tokens = generateTokens(user.id, user.role);

  return {
    user: excludePassword(user),
    ...tokens,
  };
}

export async function registerCompany(data: RegisterCompanyInput): Promise<AuthResult> {
  const existingCompany = await prisma.company.findFirst({
    where: { OR: [{ email: data.email }, { cnpj: data.cnpj }] },
  });

  if (existingCompany) {
    throw new AppError('Company already exists with this email or CNPJ', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const company = await prisma.company.create({
    data: {
      name: data.name,
      cnpj: data.cnpj,
      responsible: data.responsible,
      phone: data.phone,
      email: data.email,
      passwordHash,
    },
  });

  const tokens = generateTokens(company.id, 'company');

  return {
    company: excludePassword(company),
    ...tokens,
  };
}

export async function login(data: LoginInput): Promise<AuthResult> {
  // Try to find user first
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = generateTokens(user.id, user.role);
    return {
      user: excludePassword(user),
      ...tokens,
    };
  }

  // Try to find company
  const company = await prisma.company.findUnique({
    where: { email: data.email },
  });

  if (company) {
    const validPassword = await bcrypt.compare(data.password, company.passwordHash);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = generateTokens(company.id, 'company');
    return {
      company: excludePassword(company),
      ...tokens,
    };
  }

  throw new AppError('Invalid credentials', 401);
}

const googleClient = new OAuth2Client(config.googleClientId);

export async function googleLogin(data: GoogleLoginInput): Promise<AuthResult> {
  if (!config.googleClientId) {
    throw new AppError('Google authentication is not configured', 500);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: data.credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError('Invalid Google credential', 401);
  }

  if (!payload || !payload.email) {
    throw new AppError('Invalid Google credential: email not found', 401);
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || email.split('@')[0];

  // Try to find existing user by email
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create a new user account via Google OAuth
    // Generate a random password since the user won't use password login
    const randomPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        name,
        email,
        cpf: `google_${googleId}`.slice(0, 11).padEnd(11, '0'),
        phone: '(00) 00000-0000',
        passwordHash,
        role: 'resident',
      },
    });
  }

  const tokens = generateTokens(user.id, user.role);
  return {
    user: excludePassword(user),
    ...tokens,
  };
}

export async function refreshToken(token: string): Promise<{ token: string; refreshToken: string }> {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string; type?: string };
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401);
    }

    // Verify the user/company still exists
    if (decoded.role === 'company') {
      const company = await prisma.company.findUnique({
        where: { id: decoded.userId },
      });
      if (!company) {
        throw new AppError('User not found', 401);
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      if (!user) {
        throw new AppError('User not found', 401);
      }
    }

    return generateTokens(decoded.userId, decoded.role);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid refresh token', 401);
  }
}
