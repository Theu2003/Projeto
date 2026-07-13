import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

let io: SocketIOServer;

interface TokenPayload {
  userId: string;
  role: string;
}

export function initializeSocket(socketServer: SocketIOServer): void {
  io = socketServer;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      (socket.data as any).userId = decoded.userId;
      (socket.data as any).role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as any).userId as string;
    const role = (socket.data as any).role as string;

    if (role === 'company') {
      socket.join(`company:${userId}`);
    } else {
      socket.join(`user:${userId}`);
    }

    console.log(`Client connected: ${socket.id} (user: ${userId}, role: ${role})`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToRoom(room: string, event: string, data: unknown): void {
  io.to(room).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  emitToRoom(`user:${userId}`, event, data);
}

export function emitToCompany(companyId: string, event: string, data: unknown): void {
  emitToRoom(`company:${companyId}`, event, data);
}
