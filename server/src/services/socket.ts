import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

let io: SocketIOServer;

interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Inicializa o servidor Socket.IO
 * - Autentica conexões via JWT
 * - Atribui usuários a salas específicas
 * - Companies entram na sala 'companies' para broadcast
 */
export function initializeSocket(socketServer: SocketIOServer): void {
  io = socketServer;

  // Middleware de autenticação
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Autenticação requerida'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      (socket.data as any).userId = decoded.userId;
      (socket.data as any).role = decoded.role;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as any).userId as string;
    const role = (socket.data as any).role as string;

    // Entrar na sala apropriada
    if (role === 'company') {
      socket.join(`company:${userId}`);
      socket.join('companies'); // Sala de broadcast para todas empresas
    } else {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {});
  });
}

/**
 * Emite evento para uma sala específica
 */
export function emitToRoom(room: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(room).emit(event, data);
}

/**
 * Emite evento para um morador específico
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  emitToRoom(`user:${userId}`, event, data);
}

/**
 * Emite evento para uma empresa específica
 */
export function emitToCompany(companyId: string, event: string, data: unknown): void {
  emitToRoom(`company:${companyId}`, event, data);
}
