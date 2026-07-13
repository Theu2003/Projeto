import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { initializeSocket, getIO, emitToRoom, emitToUser, emitToCompany } from '@/services/socket';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

describe('Socket.IO Service', () => {
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  const testUserId = 'test-user-123';
  const testCompanyId = 'test-company-456';
  const testUserRole = 'resident';
  const testCompanyRole = 'company';

  function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '1h' });
  }

  function cleanup(): Promise<void> {
    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      if (clientSocket) {
        if (clientSocket.connected) {
          clientSocket.once('disconnect', () => done());
          clientSocket.disconnect();
        } else {
          done();
        }
      }

      if (ioServer) {
        ioServer.close();
      }

      if (httpServer) {
        httpServer.close(() => done());
      } else {
        done();
      }

      // Safety timeout
      setTimeout(done, 1000);
    });
  }

  afterEach(async () => {
    await cleanup();
  });

  function setupServer(): Promise<void> {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      ioServer = new SocketIOServer(httpServer, {
        cors: { origin: '*' },
      });
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as any).port;
        initializeSocket(ioServer);
        resolve();
      });
    });
  }

  function connectClient(token?: string): Promise<ClientSocket> {
    return new Promise<ClientSocket>((resolve, reject) => {
      const opts: any = {
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
      };
      if (token) {
        opts.auth = { token };
      }

      const socket = ClientIO(`http://localhost:${serverPort}`, opts);

      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (err) => reject(err));

      // Safety timeout
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });
  }

  describe('JWT Authentication', () => {
    beforeEach(async () => {
      await setupServer();
    });

    it('should connect with valid JWT token', async () => {
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);
      expect(clientSocket.connected).toBe(true);
    });

    it('should reject connection without token', async () => {
      try {
        clientSocket = await connectClient();
        expect.fail('Should have thrown');
      } catch {
        expect(clientSocket?.connected).toBeFalsy();
      }
    });

    it('should reject connection with invalid token', async () => {
      try {
        clientSocket = await connectClient('invalid-token');
        expect.fail('Should have thrown');
      } catch {
        expect(clientSocket?.connected).toBeFalsy();
      }
    });
  });

  describe('Room-based routing', () => {
    beforeEach(async () => {
      await setupServer();
    });

    it('should join user room on connection', async () => {
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      // Verify room membership from server side
      const sockets = await ioServer.in(`user:${testUserId}`).fetchSockets();
      expect(sockets.length).toBe(1);
      expect(sockets[0].id).toBe(clientSocket.id);
    });

    it('should join company room for company role', async () => {
      const token = generateToken(testCompanyId, testCompanyRole);
      clientSocket = await connectClient(token);

      // Verify room membership from server side
      const sockets = await ioServer.in(`company:${testCompanyId}`).fetchSockets();
      expect(sockets.length).toBe(1);
      expect(sockets[0].id).toBe(clientSocket.id);
    });
  });

  describe('Real-time events', () => {
    beforeEach(async () => {
      await setupServer();
    });

    it('should emit request:status_changed to user room', async () => {
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:status_changed', resolve);
      });

      emitToRoom(`user:${testUserId}`, 'request:status_changed', {
        requestId: 'req-123',
        status: 'accepted',
      });

      const data = await received;
      expect(data).toEqual({
        requestId: 'req-123',
        status: 'accepted',
      });
    });

    it('should emit request:new to company room', async () => {
      const token = generateToken(testCompanyId, testCompanyRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      emitToRoom(`company:${testCompanyId}`, 'request:new', {
        id: 'req-456',
        materialType: 'plastic',
        quantityKg: 5,
        address: 'Rua Teste, 123',
      });

      const data = await received;
      expect(data).toEqual({
        id: 'req-456',
        materialType: 'plastic',
        quantityKg: 5,
        address: 'Rua Teste, 123',
      });
    });

    it('should emit notification:new to user room', async () => {
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('notification:new', resolve);
      });

      emitToRoom(`user:${testUserId}`, 'notification:new', {
        id: 'notif-789',
        type: 'request_accepted',
        message: 'Your request was accepted',
        read: false,
      });

      const data = await received;
      expect(data).toEqual({
        id: 'notif-789',
        type: 'request_accepted',
        message: 'Your request was accepted',
        read: false,
      });
    });
  });

  describe('Helper functions', () => {
    beforeEach(async () => {
      await setupServer();
    });

    it('should emit to specific user', async () => {
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:status_changed', resolve);
      });

      emitToUser(testUserId, 'request:status_changed', {
        requestId: 'req-abc',
        status: 'completed',
      });

      const data = await received;
      expect(data.requestId).toBe('req-abc');
      expect(data.status).toBe('completed');
    });

    it('should emit to specific company', async () => {
      const token = generateToken(testCompanyId, testCompanyRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      emitToCompany(testCompanyId, 'request:new', {
        id: 'req-def',
        materialType: 'paper',
      });

      const data = await received;
      expect(data.id).toBe('req-def');
      expect(data.materialType).toBe('paper');
    });
  });

  describe('companies broadcast room', () => {
    it('should join companies room on connection for company role', async () => {
      await setupServer();
      const token = generateToken(testCompanyId, testCompanyRole);
      clientSocket = await connectClient(token);

      const sockets = await ioServer.in('companies').fetchSockets();
      expect(sockets.length).toBe(1);
      expect(sockets[0].id).toBe(clientSocket.id);
    });

    it('should not join companies room for resident role', async () => {
      await setupServer();
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      const sockets = await ioServer.in('companies').fetchSockets();
      expect(sockets.length).toBe(0);
    });

    it('should receive request:new broadcast in companies room', async () => {
      await setupServer();
      const token = generateToken(testCompanyId, testCompanyRole);
      clientSocket = await connectClient(token);

      const received = new Promise<any>((resolve) => {
        clientSocket.on('request:new', resolve);
      });

      emitToRoom('companies', 'request:new', {
        id: 'req-broadcast-001',
        materialType: 'glass',
        quantityKg: 10,
      });

      const data = await received;
      expect(data.id).toBe('req-broadcast-001');
      expect(data.materialType).toBe('glass');
    });

    it('multiple companies should all receive request:new broadcast', async () => {
      await setupServer();

      const token1 = generateToken('company-a', testCompanyRole);
      clientSocket = await connectClient(token1);

      const token2 = generateToken('company-b', testCompanyRole);
      const client2 = ClientIO(`http://localhost:${serverPort}`, {
        auth: { token: token2 },
        transports: ['websocket'],
        reconnection: false,
        forceNew: true,
      });
      await new Promise<void>((resolve, reject) => {
        client2.on('connect', () => resolve());
        client2.on('connect_error', reject);
        setTimeout(() => reject(new Error('timeout')), 3000);
      });

      const received1 = new Promise<any>((resolve) => { clientSocket.on('request:new', resolve); });
      const received2 = new Promise<any>((resolve) => { client2.on('request:new', resolve); });

      emitToRoom('companies', 'request:new', { id: 'req-multi', materialType: 'metal' });

      const [data1, data2] = await Promise.all([received1, received2]);
      expect(data1.id).toBe('req-multi');
      expect(data2.id).toBe('req-multi');

      client2.disconnect();
    });
  });

  describe('disconnection cleanup', () => {
    it('should remove user from room on disconnect', async () => {
      await setupServer();
      const token = generateToken(testUserId, testUserRole);
      clientSocket = await connectClient(token);

      let sockets = await ioServer.in(`user:${testUserId}`).fetchSockets();
      expect(sockets.length).toBe(1);

      await new Promise<void>((resolve) => {
        clientSocket.once('disconnect', () => resolve());
        clientSocket.disconnect();
      });

      // Give server time to process disconnect and clean up rooms
      await new Promise((resolve) => setTimeout(resolve, 100));

      sockets = await ioServer.in(`user:${testUserId}`).fetchSockets();
      expect(sockets.length).toBe(0);
    });
  });

  describe('getIO', () => {
    beforeEach(async () => {
      await setupServer();
    });

    it('should return the socket.io server instance', () => {
      const io = getIO();
      expect(io).toBe(ioServer);
    });
  });
});
