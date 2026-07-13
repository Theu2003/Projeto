import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateRequestInput, RescheduleRequestInput, CompleteRequestInput } from './request.validation';

export async function createRequest(userId: string, data: CreateRequestInput) {
  return prisma.collectionRequest.create({
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

export async function acceptRequest(id: string, companyId: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending') throw new AppError('Request cannot be accepted', 400);

  return prisma.collectionRequest.update({
    where: { id },
    data: { status: 'accepted', companyId },
  });
}

export async function rejectRequest(id: string, companyId: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'pending') throw new AppError('Request cannot be rejected', 400);

  return prisma.collectionRequest.update({
    where: { id },
    data: { status: 'cancelled', companyId },
  });
}

export async function onTheWay(id: string, companyId: string) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'accepted') throw new AppError('Request must be accepted first', 400);
  if (request.companyId !== companyId) throw new AppError('Not your request', 403);

  return prisma.collectionRequest.update({
    where: { id },
    data: { status: 'on_the_way' },
  });
}

export async function completeRequest(id: string, companyId: string, data: CompleteRequestInput) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'on_the_way') throw new AppError('Request must be on the way to complete', 400);
  if (request.companyId !== companyId) throw new AppError('Not your request', 403);

  return prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'completed',
      realWeight: data.realWeight,
      completedAt: new Date(),
    },
  });
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

  return prisma.collectionRequest.update({
    where: { id },
    data: { status: 'cancelled' },
  });
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

  return prisma.collectionRequest.update({
    where: { id },
    data: {
      status: 'rescheduled',
      desiredDate: data.desiredDate,
      desiredTime: data.desiredTime,
    },
  });
}
