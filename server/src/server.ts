import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { initializeSocket } from './services/socket.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

/**
 * Servidor HTTP + Socket.IO para comunicação em tempo real
 */
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Inicializa Socket.IO com autenticação
initializeSocket(io);

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         🌱 EcoColeta Server             ║
║──────────────────────────────────────────║
║  🚀 Servidor rodando em:                ║
║  📡 http://localhost:${PORT}              ║
║  🔌 WebSocket ativo                     ║
║  🗄️  SQLite + Prisma                    ║
╚══════════════════════════════════════════╝
  `);
});

export default httpServer;
