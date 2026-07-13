import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`EcoColeta server running on http://localhost:${PORT}`);
});

export default httpServer;
