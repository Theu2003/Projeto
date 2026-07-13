import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { initializeSocket, emitToRoom, emitToUser, emitToCompany } from '@/services/socket';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

describe('Request Socket Integration', () => {
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  const testUserId = 'resident-001';
  const testCompanyId = 'company-001';

  function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '1h' });
  }

  function setupServer(): Promise<void> {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      ioServer = new SocketIOServer(httpServer, { cors: { origin: '*' } });
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as any).port;
        initializeSocket(ioServer);
        resolve();
      });
    });
  }

  function connectClient(token: string): Promise<ClientSocket> {
    return new Promise<ClientSocket>((resolve, reject) => {
      const socket = ClientIO(`http://localhost:${serverPort}`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (err) => reject(err));
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });
  }

  function cleanup(): Promise<void> {
    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) { resolved = true; resolve(); }
      };
      if (clientSocket?.connected) {
        clientSocket.once('disconnect', () => done());
        clientSocket.disconnect();
      } else {
        done();
      }
      if (ioServer) ioServer.close();
      if (httpServer) httpServer.close(() => done()); else done();
      setTimeout(done, 1000);
    });
  }

  afterEach(async () => {
    await cleanup();
  });

  describe('request:new event', () => {
    it('should be emitted to company room when request is created', async () => {
      await setupServer();

      const companyToken = generateToken(testCompanyId, 'company');
      clientSocket = await connectClient(companyToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      const requestData = {
        id: 'req-new-001',
        userId: testUserId,
        materialType: 'plastic',
        quantityKg: 5,
        address: 'Rua Verde, 123',
        latitude: -23.55,
        longitude: -46.63,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      emitToRoom(`company:${testCompanyId}`, 'request:new', requestData);

      const data = await received;
      expect(data.id).toBe('req-new-001');
      expect(data.materialType).toBe('plastic');
      expect(data.quantityKg).toBe(5);
      expect(data.status).toBe('pending');
    });

    it('should not be received by resident rooms', async () => {
      await setupServer();

      const residentToken = generateToken(testUserId, 'resident');
      clientSocket = await connectClient(residentToken);

      let received = false;
      clientSocket.on('request:new', () => { received = true; });

      emitToRoom(`company:${testCompanyId}`, 'request:new', { id: 'req-xyz' });

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(received).toBe(false);
    });
  });

  describe('request:status_changed event', () => {
    it('should be emitted to user room when request status changes', async () => {
      await setupServer();

      const userToken = generateToken(testUserId, 'resident');
      clientSocket = await connectClient(userToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:status_changed', resolve);
      });

      const statusData = {
        requestId: 'req-001',
        status: 'accepted',
        companyId: testCompanyId,
      };

      emitToRoom(`user:${testUserId}`, 'request:status_changed', statusData);

      const data = await received;
      expect(data.requestId).toBe('req-001');
      expect(data.status).toBe('accepted');
      expect(data.companyId).toBe(testCompanyId);
    });

    it('should be emitted to company room when company updates status', async () => {
      await setupServer();

      const companyToken = generateToken(testCompanyId, 'company');
      clientSocket = await connectClient(companyToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:status_changed', resolve);
      });

      const statusData = {
        requestId: 'req-002',
        status: 'on_the_way',
      };

      emitToRoom(`company:${testCompanyId}`, 'request:status_changed', statusData);

      const data = await received;
      expect(data.requestId).toBe('req-002');
      expect(data.status).toBe('on_the_way');
    });
  });

  describe('companies broadcast room', () => {
    it('should deliver request:new to all companies via broadcast room', async () => {
      await setupServer();

      const companyToken = generateToken(testCompanyId, 'company');
      clientSocket = await connectClient(companyToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      // Emit to broadcast 'companies' room (as request.service does)
      emitToRoom('companies', 'request:new', {
        id: 'req-broadcast',
        userId: testUserId,
        materialType: 'plastic',
        quantityKg: 3,
        status: 'pending',
      });

      const data = await received;
      expect(data.id).toBe('req-broadcast');
      expect(data.materialType).toBe('plastic');
    });

    it('should not deliver request:new to residents via broadcast room', async () => {
      await setupServer();

      const residentToken = generateToken(testUserId, 'resident');
      clientSocket = await connectClient(residentToken);

      let received = false;
      clientSocket.on('request:new', () => { received = true; });

      emitToRoom('companies', 'request:new', { id: 'req-broadcast-2' });

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(received).toBe(false);
    });
  });

  describe('emitToUser helper', () => {
    it('should deliver events to correct user', async () => {
      await setupServer();

      const userToken = generateToken(testUserId, 'resident');
      clientSocket = await connectClient(userToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('notification:new', resolve);
      });

      emitToUser(testUserId, 'notification:new', {
        id: 'notif-001',
        message: 'Your request was accepted',
      });

      const data = await received;
      expect(data.id).toBe('notif-001');
      expect(data.message).toBe('Your request was accepted');
    });
  });

  describe('emitToCompany helper', () => {
    it('should deliver events to correct company', async () => {
      await setupServer();

      const companyToken = generateToken(testCompanyId, 'company');
      clientSocket = await connectClient(companyToken);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      emitToCompany(testCompanyId, 'request:new', {
        id: 'req-003',
        materialType: 'paper',
      });

      const data = await received;
      expect(data.id).toBe('req-003');
      expect(data.materialType).toBe('paper');
    });
  });
});
