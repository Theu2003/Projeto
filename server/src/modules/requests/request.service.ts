import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import {
  CreateRequestInput,
  RescheduleRequestInput,
  CompleteRequestInput,
} from './request.validation';
import { emitToUser, emitToRoom } from '@/services/socket';

/**
 * Cria uma nova solicitação de coleta
 * Notifica todas as empresas próximas via Socket.IO
 */
export async function createRequest(userId: string, data: CreateRequestInput) {
  const request = await prisma.collectionRequest.create({
    data: {
      userId,
      materialType: data.materialType,
      quantityKg: data.quantityKg,
      observations: data.observations,
      photos: JSON.stringify(data.photos ?? []),
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
    },
  });

  // Notificar todas as empresas sobre nova solicitação
  emitToRoom('companies', 'request:new', {
    id: request.id,
    userId: request.userId,
    materialType: request.materialType,
    quantityKg: request.quantityKg,
    address: request.address,
    latitude: request.latitude,
    longitude: request.longitude,
    desiredDate: request.desiredDate,
    desiredTime: request.desiredTime,
    status: request.status,
    createdAt: request.createdAt,
  });

  return request;
}

/**
 * Lista solicitações do usuário ou empresa logada
 */
export async function listRequests(actorId: string, role: string) {
  if (role === 'company') {
    return prisma.collectionRequest.findMany({
      where: { companyId: actorId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  if (role === 'admin') {
    return prisma.collectionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  return prisma.collectionRequest.findMany({
    where: { userId: actorId },
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true, phone: true, rating: true } },
    },
  });
}

/**
 * Retorna detalhes de uma solicitação específica
 */
export async function getRequestById(id: string) {
  const request = await prisma.collectionRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      company: { select: { id: true, name: true, phone: true, rating: true } },
    },
  });

  if (!request) throw new AppError('Solicitação não encontrada', 404);
  return request;
}

/**
 * Empresa aceita uma solicitação
 */
export async function acceptRequest(id: string, companyId: string, role?: string) {
  if (role && role !== 'company') throw new AppError('Apenas empresas podem aceitar solicitações', 403);

  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.status !== 'pending') throw new AppError('Solicitação não pode ser aceita', 400);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'accepted', companyId },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'accepted',
    companyId,
  });

  return updated;
}

/**
 * Empresa recusa uma solicitação (libera para outras empresas)
 * Remove o companyId da solicitação para que outras empresas possam aceitá-la
 */
export async function rejectRequest(id: string, companyId: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.status !== 'pending') throw new AppError('Solicitação não pode ser recusada', 400);

  // Liberar a solicitação removendo vínculo com a empresa
  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { companyId: null },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'pending',
    rejectedBy: companyId,
  });

  return updated;
}

/**
 * Empresa informa que está a caminho
 */
export async function onTheWay(id: string, companyId: string, role?: string) {
  if (role && role !== 'company') throw new AppError('Apenas empresas podem atualizar para "a caminho"', 403);

  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.status !== 'accepted') throw new AppError('Solicitação precisa ser aceita primeiro', 400);
  if (request.companyId !== companyId) throw new AppError('Não é sua solicitação', 403);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'on_the_way' },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'on_the_way',
    companyId,
  });

  return updated;
}

/**
 * Empresa finaliza a coleta
 * Registra peso real e calcula pontos para o morador
 */
export async function completeRequest(
  id: string,
  companyId: string,
  data: CompleteRequestInput,
  role?: string
) {
  if (role && role !== 'company') throw new AppError('Apenas empresas podem finalizar coletas', 403);

  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.status !== 'on_the_way') throw new AppError('Solicitação precisa estar "a caminho"', 400);
  if (request.companyId !== companyId) throw new AppError('Não é sua solicitação', 403);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'completed',
      realWeight: data.realWeight,
      completedAt: new Date(),
    },
  });

  // Calcular e creditar pontos para o morador (10 pontos por kg)
  const pointsEarned = Math.floor((data.realWeight ?? 0) * 10);
  await prisma.user.update({
    where: { id: request.userId },
    data: { points: { increment: pointsEarned } },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'completed',
    companyId,
    realWeight: data.realWeight,
    pointsEarned,
  });

  return updated;
}

/**
 * Cancela uma solicitação (morador ou empresa)
 */
export async function cancelRequest(id: string, actorId: string, role: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.status === 'completed') throw new AppError('Não é possível cancelar coleta finalizada', 400);

  if (role === 'resident' && request.userId !== actorId) {
    throw new AppError('Não é sua solicitação', 403);
  }
  if (role === 'company' && request.companyId !== actorId) {
    throw new AppError('Não é sua solicitação', 403);
  }

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'cancelled',
    cancelledBy: role,
  });

  if (request.companyId) {
    emitToRoom(`company:${request.companyId}`, 'request:status_changed', {
      requestId: id,
      status: 'cancelled',
      cancelledBy: role,
    });
  }

  return updated;
}

/**
 * Reagenda uma solicitação
 */
export async function rescheduleRequest(
  id: string,
  actorId: string,
  role: string,
  data: RescheduleRequestInput
) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);

  if (role === 'resident' && request.userId !== actorId) {
    throw new AppError('Não é sua solicitação', 403);
  }
  if (role === 'company' && request.companyId !== actorId) {
    throw new AppError('Não é sua solicitação', 403);
  }

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'rescheduled',
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime,
    },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'rescheduled',
    desiredDate: data.desiredDate,
    desiredTime: data.desiredTime,
  });

  if (request.companyId) {
    emitToRoom(`company:${request.companyId}`, 'request:status_changed', {
      requestId: id,
      status: 'rescheduled',
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime,
    });
  }

  return updated;
}
