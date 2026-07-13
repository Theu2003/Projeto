import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSocket = {
  id: 'mock-socket-id',
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
};

const mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

import { getSocket, disconnectSocket } from '@/services/socket';

describe('Socket.IO Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockIo.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    disconnectSocket();
  });

  describe('getSocket', () => {
    it('should create a socket connection with token', () => {
      const socket = getSocket('test-token-123');

      expect(mockIo).toHaveBeenCalledTimes(1);
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'test-token-123' },
          transports: ['websocket'],
          autoConnect: true,
        })
      );
      expect(socket).toBe(mockSocket);
    });

    it('should reuse existing socket instance', () => {
      const socket1 = getSocket('test-token');
      const socket2 = getSocket('test-token');

      expect(mockIo).toHaveBeenCalledTimes(1);
      expect(socket1).toBe(socket2);
    });

    it('should set up connect listener', () => {
      getSocket('test-token');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should set up disconnect listener', () => {
      getSocket('test-token');

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should set up connect_error listener', () => {
      getSocket('test-token');

      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });

  describe('disconnectSocket', () => {
    it('should disconnect an active socket', () => {
      getSocket('test-token');
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call when no socket exists', () => {
      expect(() => disconnectSocket()).not.toThrow();
    });

    it('should allow creating a new socket after disconnect', () => {
      getSocket('test-token');
      disconnectSocket();

      const newSocket = getSocket('new-token');

      expect(mockIo).toHaveBeenCalledTimes(2);
      expect(newSocket).toBe(mockSocket);
    });
  });
});
