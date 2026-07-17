import crypto from 'crypto';
import { prisma } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/env';
import { AppError } from '@/middleware/errorHandler';
import { sendPasswordResetCode } from '@/services/email';
import {
  RegisterResidentInput,
  RegisterCompanyInput,
  LoginInput,
  GoogleLoginInput,
  ForgotPasswordInput,
  VerifyResetCodeInput,
  ResetPasswordInput,
} from './auth.validation';
import { excludePassword } from '@/utils/password';

const googleClient = new OAuth2Client(config.googleClientId);

// ============================================================
// Tipos e utilitários
// ============================================================

function generateTokens(userId: string, role: string) {
  const token = jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId, role, type: 'refresh' }, config.jwtSecret, { expiresIn: '30d' });
  return { token, refreshToken };
}

// ============================================================
// Registro de morador
// ============================================================

export async function registerResident(data: RegisterResidentInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { cpf: data.cpf }] },
  });

  if (existing) {
    throw new AppError('Usuário já existe com este email ou CPF', 409);
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
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: excludePassword(user),
    company: null,
  };
}

// ============================================================
// Registro de empresa
// ============================================================

export async function registerCompany(data: RegisterCompanyInput) {
  const existing = await prisma.company.findFirst({
    where: { OR: [{ email: data.email }, { cnpj: data.cnpj }] },
  });

  if (existing) {
    throw new AppError('Empresa já existe com este email ou CNPJ', 409);
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
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: null,
    company: excludePassword(company),
  };
}

// ============================================================
// Login (suporta morador e empresa)
// ============================================================

export async function login(data: LoginInput) {
  // Tentar encontrar morador
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (user) {
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new AppError('Credenciais inválidas', 401);

    const tokens = generateTokens(user.id, user.role);
    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: excludePassword(user),
      company: null,
    };
  }

  // Tentar encontrar empresa
  const company = await prisma.company.findUnique({ where: { email: data.email } });

  if (company) {
    const valid = await bcrypt.compare(data.password, company.passwordHash);
    if (!valid) throw new AppError('Credenciais inválidas', 401);

    const tokens = generateTokens(company.id, 'company');
    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: null,
      company: excludePassword(company),
    };
  }

  throw new AppError('Credenciais inválidas', 401);
}

// ============================================================
// Google Login
// ============================================================

export async function googleLogin(data: GoogleLoginInput) {
  if (!config.googleClientId) {
    throw new AppError('Autenticação Google não configurada', 500);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: data.credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Credencial Google inválida', 401);
  }

  if (!payload?.email) {
    throw new AppError('Email não encontrado na credencial Google', 401);
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || email.split('@')[0];

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
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
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: excludePassword(user),
    company: null,
  };
}

// ============================================================
// Esqueci minha senha - Enviar código
// ============================================================

export async function forgotPassword(data: ForgotPasswordInput) {
  // Gerar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  // Tentar encontrar usuário ou empresa
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const company = await prisma.company.findUnique({ where: { email: data.email } });

  if (!user && !company) {
    // Não revelar se o email existe ou não (segurança)
    return { message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' };
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode: codeHash, resetCodeExpiresAt: expiresAt },
    });
  } else if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: { resetCode: codeHash, resetCodeExpiresAt: expiresAt },
    });
  }

  // Enviar email PRIMEIRO; se falhar, o código não fica órfão no banco
  await sendPasswordResetCode(data.email, code);

  return { message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' };
}

// ============================================================
// Verificar código de recuperação
// ============================================================

export async function verifyResetCode(data: VerifyResetCodeInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const company = await prisma.company.findUnique({ where: { email: data.email } });

  const account = user || company;

  if (!account || !account.resetCode || !account.resetCodeExpiresAt) {
    throw new AppError('Código inválido ou expirado', 400);
  }

  if (new Date() > account.resetCodeExpiresAt) {
    throw new AppError('Código expirado. Solicite um novo código.', 400);
  }

  const valid = await bcrypt.compare(data.code, account.resetCode);
  if (!valid) {
    throw new AppError('Código inválido', 400);
  }

  return { message: 'Código verificado com sucesso.' };
}

// ============================================================
// Redefinir senha
// ============================================================

export async function resetPassword(data: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const company = await prisma.company.findUnique({ where: { email: data.email } });

  const account = user || company;

  if (!account || !account.resetCode || !account.resetCodeExpiresAt) {
    throw new AppError('Código inválido ou expirado. Solicite um novo código.', 400);
  }

  if (new Date() > account.resetCodeExpiresAt) {
    throw new AppError('Código expirado. Solicite um novo código.', 400);
  }

  const valid = await bcrypt.compare(data.code, account.resetCode);
  if (!valid) {
    throw new AppError('Código inválido', 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });
  } else if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });
  }

  return { message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' };
}

// ============================================================
// Refresh Token
// ============================================================

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      role: string;
      type?: string;
    };

    if (decoded.type !== 'refresh') {
      throw new AppError('Refresh token inválido', 401);
    }

    // Verificar se usuário/empresa ainda existe
    if (decoded.role === 'company') {
      const company = await prisma.company.findUnique({ where: { id: decoded.userId } });
      if (!company) throw new AppError('Usuário não encontrado', 401);
    } else {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new AppError('Usuário não encontrado', 401);
    }

    return generateTokens(decoded.userId, decoded.role);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Refresh token inválido ou expirado', 401);
  }
}
