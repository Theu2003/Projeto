import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('RequestService', () => {
  let residentId: string;
  let companyId: string;
  let materialId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const user = await prisma.user.create({
      data: {
        name: 'Request Test Resident',
        cpf: '77777777771',
        phone: '11999999999',
        email: 'request-svc-test@email.com',
        passwordHash: 'hashedpassword',
        role: 'resident',
      },
    });
    residentId = user.id;

    const company = await prisma.company.create({
      data: {
        name: 'Request Test Company',
        cnpj: '77777777000195',
        responsible: 'João Silva',
        phone: '11999999999',
        email: 'request-company-svc-test@email.com',
        passwordHash: 'hashedpassword',
        approved: true,
      },
    });
    companyId = company.id;

    const material = await prisma.material.create({
      data: {
        name: 'Plastic',
        icon: '♻️',
        category: 'plastic',
        recyclable: true,
        pointsPerKg: 10,
      },
    });
    materialId = material.id;
  });

  afterAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('createRequest', () => {
    it('should create a collection request with valid data', async () => {
      const { createRequest } = await import('@/modules/requests/request.service');

      const result = await createRequest(residentId, {
        materialType: 'plastic',
        quantityKg: 5,
        address: 'Rua Teste, 123',
        latitude: -23.55,
        longitude: -46.63,
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('materialType', 'plastic');
      expect(result).toHaveProperty('quantityKg', 5);
      expect(result).toHaveProperty('userId', residentId);
    });

    it('should store desiredDate and desiredTime', async () => {
      const { createRequest } = await import('@/modules/requests/request.service');

      const result = await createRequest(residentId, {
        materialType: 'paper',
        quantityKg: 10,
        desiredDate: '2026-08-01',
        desiredTime: '14:00',
      });

      expect(result).toHaveProperty('desiredDate', '2026-08-01');
      expect(result).toHaveProperty('desiredTime', '14:00');
    });
  });

  describe('listRequests', () => {
    it('should list requests for a resident', async () => {
      const { listRequests } = await import('@/modules/requests/request.service');

      const result = await listRequests(residentId, 'resident');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('userId', residentId);
    });

    it('should list requests for a company', async () => {
      const { listRequests } = await import('@/modules/requests/request.service');

      const result = await listRequests(companyId, 'company');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRequestById', () => {
    it('should return a request by id', async () => {
      const { createRequest, getRequestById } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'glass',
        quantityKg: 3,
      });

      const result = await getRequestById(created.id);

      expect(result).toHaveProperty('id', created.id);
      expect(result).toHaveProperty('materialType', 'glass');
      expect(result).toHaveProperty('user');
    });

    it('should throw for non-existent request', async () => {
      const { getRequestById } = await import('@/modules/requests/request.service');

      await expect(getRequestById('non-existent-id')).rejects.toThrow();
    });
  });

  describe('acceptRequest', () => {
    it('should accept a pending request', async () => {
      const { createRequest, acceptRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'plastic',
        quantityKg: 2,
      });

      const result = await acceptRequest(created.id, companyId);

      expect(result).toHaveProperty('status', 'accepted');
      expect(result).toHaveProperty('companyId', companyId);
    });

    it('should throw when accepting already accepted request', async () => {
      const { createRequest, acceptRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'paper',
        quantityKg: 1,
      });
      await acceptRequest(created.id, companyId);

      await expect(acceptRequest(created.id, companyId)).rejects.toThrow();
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request', async () => {
      const { createRequest, rejectRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'metal',
        quantityKg: 4,
      });

      const result = await rejectRequest(created.id, companyId);

      expect(result).toHaveProperty('status', 'cancelled');
    });
  });

  describe('onTheWay', () => {
    it('should update status to on_the_way', async () => {
      const { createRequest, acceptRequest, onTheWay } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'plastic',
        quantityKg: 1,
      });
      await acceptRequest(created.id, companyId);

      const result = await onTheWay(created.id, companyId);

      expect(result).toHaveProperty('status', 'on_the_way');
    });

    it('should throw if request is not accepted', async () => {
      const { createRequest, onTheWay } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'paper',
        quantityKg: 1,
      });

      await expect(onTheWay(created.id, companyId)).rejects.toThrow();
    });
  });

  describe('completeRequest', () => {
    it('should complete a request with real weight', async () => {
      const { createRequest, acceptRequest, onTheWay, completeRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'glass',
        quantityKg: 5,
      });
      await acceptRequest(created.id, companyId);
      await onTheWay(created.id, companyId);

      const result = await completeRequest(created.id, companyId, { realWeight: 4.8 });

      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('realWeight', 4.8);
      expect(result).toHaveProperty('completedAt');
    });

    it('should throw if request is not on_the_way', async () => {
      const { createRequest, acceptRequest, completeRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'plastic',
        quantityKg: 2,
      });
      await acceptRequest(created.id, companyId);

      await expect(completeRequest(created.id, companyId, { realWeight: 1.5 })).rejects.toThrow();
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request by the owner', async () => {
      const { createRequest, cancelRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'paper',
        quantityKg: 3,
      });

      const result = await cancelRequest(created.id, residentId, 'resident');

      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should cancel an accepted request by the company', async () => {
      const { createRequest, acceptRequest, cancelRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'plastic',
        quantityKg: 1,
      });
      await acceptRequest(created.id, companyId);

      const result = await cancelRequest(created.id, companyId, 'company');

      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should throw if completed request is cancelled', async () => {
      const { createRequest, acceptRequest, onTheWay, completeRequest, cancelRequest } =
        await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'glass',
        quantityKg: 2,
      });
      await acceptRequest(created.id, companyId);
      await onTheWay(created.id, companyId);
      await completeRequest(created.id, companyId, { realWeight: 1.8 });

      await expect(cancelRequest(created.id, residentId, 'resident')).rejects.toThrow();
    });
  });

  describe('rescheduleRequest', () => {
    it('should reschedule a pending request', async () => {
      const { createRequest, rescheduleRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'metal',
        quantityKg: 2,
        desiredDate: '2026-08-01',
        desiredTime: '10:00',
      });

      const result = await rescheduleRequest(created.id, residentId, 'resident', {
        desiredDate: '2026-08-05',
        desiredTime: '15:00',
      });

      expect(result).toHaveProperty('status', 'rescheduled');
      expect(result).toHaveProperty('desiredDate', '2026-08-05');
      expect(result).toHaveProperty('desiredTime', '15:00');
    });

    it('should throw when rescheduling by non-owner', async () => {
      const { createRequest, rescheduleRequest } = await import('@/modules/requests/request.service');

      const created = await createRequest(residentId, {
        materialType: 'paper',
        quantityKg: 1,
      });

      await expect(
        rescheduleRequest(created.id, companyId, 'company', {
          desiredDate: '2026-08-10',
          desiredTime: '09:00',
        })
      ).rejects.toThrow();
    });
  });
});
