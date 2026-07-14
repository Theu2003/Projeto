import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import {
  CreateRequestInput,
  RescheduleRequestInput,
  UpdateRequestInput,
  CompleteRequestInput,
} from './request.validation';
import { emitToUser, emitToRoom } from '@/services/socket';
import { haversineDistance } from '@/utils/distance';

/**
 * Cria uma nova solicitação de coleta
 * Notifica apenas as empresas da região via Socket.IO
 * Atribui automaticamente à empresa mais próxima (estilo Uber)
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

  // Buscar todas as empresas aprovadas e ativas com coordenadas
  const companies = await prisma.company.findMany({
    where: {
      approved: true,
      active: true,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  // Se a solicitação tem coordenadas, filtrar empresas por região
  if (request.latitude && request.longitude && companies.length > 0) {
    // Calcular distância e filtrar pelo raio de serviço de cada empresa
    const nearbyCompanies = companies
      .map((c) => ({
        id: c.id,
        name: c.name,
        distance: haversineDistance(
          request.latitude!,
          request.longitude!,
          c.latitude!,
          c.longitude!
        ),
        serviceAreaRadius: c.serviceAreaRadius,
      }))
      .filter((c) => c.distance <= c.serviceAreaRadius)
      .sort((a, b) => a.distance - b.distance);

    // Notificar cada empresa da região individualmente
    for (const company of nearbyCompanies) {
      emitToRoom(`company:${company.id}`, 'request:new', {
        id: request.id,
        materialType: request.materialType,
        quantityKg: request.quantityKg,
        address: request.address,
        latitude: request.latitude,
        longitude: request.longitude,
        desiredDate: request.desiredDate,
        desiredTime: request.desiredTime,
        status: request.status,
        createdAt: request.createdAt,
        distance: Math.round(company.distance * 10) / 10,
      });
    }

    // Se houver empresas na região, atribuir à mais próxima
    if (nearbyCompanies.length > 0) {
      const nearest = nearbyCompanies[0];
      const updated = await prisma.collectionRequest.update({
        where: { id: request.id },
        data: {
          companyId: nearest.id,
          status: 'accepted',
        },
      });

      // Notificar o morador
      emitToUser(userId, 'request:status_changed', {
        requestId: request.id,
        status: 'accepted',
        companyId: nearest.id,
        companyName: nearest.name,
        distanceKm: Math.round(nearest.distance * 10) / 10,
      });

      return {
        ...updated,
        nearestCompany: nearest.name,
        distanceKm: Math.round(nearest.distance * 10) / 10,
      };
    }
  }

  // Fallback: sem coordenadas ou sem empresas na região
  // Notificar todas as empresas via broadcast global
  if (companies.length > 0) {
    emitToRoom('companies', 'request:new', {
      id: request.id,
      materialType: request.materialType,
      quantityKg: request.quantityKg,
      address: request.address,
      status: request.status,
      createdAt: request.createdAt,
    });
  }

  return request;
}

/**
 * Lista solicitações do usuário ou empresa logada
 * Empresas veem solicitações da sua região + as que já aceitaram
 */
export async function listRequests(actorId: string, role: string) {
  if (role === 'company') {
    // Buscar solicitações já aceitas por esta empresa
    const myRequests = await prisma.collectionRequest.findMany({
      where: { companyId: actorId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Buscar também solicitações pendentes na região da empresa
    const company = await prisma.company.findUnique({
      where: { id: actorId },
      select: { latitude: true, longitude: true, serviceAreaRadius: true },
    });

    if (company?.latitude && company?.longitude) {
      const allPending = await prisma.collectionRequest.findMany({
        where: {
          status: 'pending',
          latitude: { not: null },
          longitude: { not: null },
          companyId: null,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      const nearbyPending = allPending
        .map((req) => ({
          ...req,
          distance: haversineDistance(
            company.latitude!,
            company.longitude!,
            req.latitude!,
            req.longitude!
          ),
        }))
        .filter((req) => req.distance <= company.serviceAreaRadius)
        .sort((a, b) => a.distance - b.distance);

      // Combinar: minhas solicitações + solicitações pendentes na região
      // Usar um Set para evitar duplicatas
      const seenIds = new Set(myRequests.map((r) => r.id));
      const combined = [
        ...myRequests.map((r) => ({ ...r, distance: undefined })),
        ...nearbyPending.filter((r) => !seenIds.has(r.id)),
      ];

      return combined;
    }

    return myRequests;
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
 * Edita uma solicitação pendente (morador)
 */
export async function updateRequest(id: string, userId: string, data: UpdateRequestInput) {
  const request = await prisma.collectionRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitação não encontrada', 404);
  if (request.userId !== userId) throw new AppError('Não é sua solicitação', 403);
  if (request.status !== 'pending') throw new AppError('Só é possível editar solicitações pendentes', 400);

  const updated = await prisma.collectionRequest.update({
    where: { id },
    data: {
      ...(data.materialType !== undefined && { materialType: data.materialType }),
      ...(data.quantityKg !== undefined && { quantityKg: data.quantityKg }),
      ...(data.observations !== undefined && { observations: data.observations }),
      ...(data.desiredDate !== undefined && { desiredDate: data.desiredDate }),
    },
  });

  emitToRoom('companies', 'request:updated', {
    id: updated.id,
    materialType: updated.materialType,
    quantityKg: updated.quantityKg,
    observations: updated.observations,
    desiredDate: updated.desiredDate,
    status: updated.status,
  });

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
