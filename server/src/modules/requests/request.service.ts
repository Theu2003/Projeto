import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateRequestInput, RescheduleRequestInput, CompleteRequestInput } from './request.validation';
import { emitToUser, emitToRoom } from '@/services/socket';

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

  // Emit to all companies that a new request is available
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

export async function listRequests(actorId: string, role: string) {
  if (role === 'company') {
    return prisma.collectionRequest.findMany({
      where: { companyId: actorId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
  }

  return prisma.collectionRequest.findMany({
    where: { userId: actorId },
    orderBy: { createdAt: 'desc' },
    include: { company: { select: { id: true, name: true, phone: true, rating: true } } },
  });
}

export async function getRequestById(id: string) {
  const request = await prisma.collectionRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, address: true } },
      company: { select: { id: true, name: true, phone: true, rating: true } },
    },
  });
  if (!request) throw new AppError('Request not found', 404);
  return request;
}

export async function acceptRequest(id: string, companyId: string, role?: string) {
  if (role && role !== 'company') throw new AppError('Only companies can accept requests', 403);
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending') throw new AppError('Request cannot be accepted', 400);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'accepted', companyId },
  });

  // Notify the resident that their request was accepted
  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'accepted',
    companyId,
  });

  return updated;
}

export async function rejectRequest(id: string, companyId: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending') throw new AppError('Request cannot be rejected', 400);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'pending', companyId: null },
  });

  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'pending',
    rejectedBy: companyId,
  });

  return updated;
}

export async function onTheWay(id: string, companyId: string, role?: string) {
  if (role && role !== 'company') throw new AppError('Only companies can update to on_the_way', 403);
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'accepted') throw new AppError('Request must be accepted first', 400);
  if (request.companyId !== companyId) throw new AppError('Not your request', 403);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'on_the_way' },
  });

  // Notify the resident that the company is on the way
  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'on_the_way',
    companyId,
  });

  return updated;
}

export async function completeRequest(id: string, companyId: string, data: CompleteRequestInput, role?: string) {
  if (role && role !== 'company') throw new AppError('Only companies can complete requests', 403);
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'on_the_way') throw new AppError('Request must be on the way to complete', 400);
  if (request.companyId !== companyId) throw new AppError('Not your request', 403);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'completed',
      realWeight: data.realWeight,
      completedAt: new Date(),
    },
  });

  // Notify the resident that the collection is complete
  emitToUser(request.userId, 'request:status_changed', {
    requestId: id,
    status: 'completed',
    companyId,
    realWeight: data.realWeight,
  });

  return updated;
}

export async function cancelRequest(id: string, actorId: string, role: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status === 'completed') throw new AppError('Cannot cancel completed request', 400);

  if (role === 'resident' && request.userId !== actorId) {
    throw new AppError('Not your request', 403);
  }
  if (role === 'company' && request.companyId !== actorId) {
    throw new AppError('Not your request', 403);
  }

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  // Notify both parties about cancellation
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

export async function rescheduleRequest(
  id: string,
  actorId: string,
  role: string,
  data: RescheduleRequestInput
) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);

  if (role === 'resident' && request.userId !== actorId) {
    throw new AppError('Not your request', 403);
  }
  if (role === 'company' && request.companyId !== actorId) {
    throw new AppError('Not your request', 403);
  }

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'rescheduled',
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime,
    },
  });

  // Notify both parties about reschedule
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
