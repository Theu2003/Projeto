import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from '@/hooks/useSocket';

const mockSocket = {
  id: 'mock-socket-id',
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

const mockGetToken = vi.fn();
const mockClearToken = vi.fn();

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: (...args: unknown[]) => mockGetToken(...args),
    clearToken: (...args: unknown[]) => mockClearToken(...args),
  },
}));

vi.mock('@/services/socket', () => ({
  getSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(),
}));

import { getSocket, disconnectSocket } from '@/services/socket';

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue('test-token');
    mockSocket.connected = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection', () => {
    it('should connect when token is available', () => {
      mockGetToken.mockReturnValue('test-token');

      renderHook(() => useSocket());

      expect(getSocket).toHaveBeenCalledWith('test-token');
    });

    it('should not connect when no token is available', () => {
      mockGetToken.mockReturnValue(null);

      renderHook(() => useSocket());

      expect(getSocket).not.toHaveBeenCalled();
    });

    it('should disconnect on unmount', () => {
      mockGetToken.mockReturnValue('test-token');

      const { unmount } = renderHook(() => useSocket());
      unmount();

      expect(disconnectSocket).toHaveBeenCalled();
    });

    it('should disconnect when token is removed', () => {
      mockGetToken.mockReturnValue('test-token');

      const { result, rerender } = renderHook(() => useSocket());

      // Simulate logout by clearing token
      mockGetToken.mockReturnValue(null);
      rerender();

      expect(disconnectSocket).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should provide on method that registers event listener', () => {
      mockGetToken.mockReturnValue('test-token');

      const { result } = renderHook(() => useSocket());
      const callback = vi.fn();

      act(() => {
        result.current.on('test-event', callback);
      });

      expect(mockSocket.on).toHaveBeenCalledWith('test-event', callback);
    });

    it('should provide off method that removes event listener', () => {
      mockGetToken.mockReturnValue('test-token');

      const { result } = renderHook(() => useSocket());
      const callback = vi.fn();

      act(() => {
        result.current.off('test-event', callback);
      });

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', callback);
    });

    it('should provide emit method that sends events', () => {
      mockGetToken.mockReturnValue('test-token');

      const { result } = renderHook(() => useSocket());
      const data = { latitude: -23.55, longitude: -46.63 };

      act(() => {
        result.current.emit('location:update', data);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('location:update', data);
    });
  });

  describe('Socket Reference', () => {
    it('should expose socket reference', () => {
      mockGetToken.mockReturnValue('test-token');

      const { result } = renderHook(() => useSocket());

      expect(result.current.socket).toBe(mockSocket);
    });

    it('should return null socket when not connected', () => {
      mockGetToken.mockReturnValue(null);

      const { result } = renderHook(() => useSocket());

      expect(result.current.socket).toBeNull();
    });
  });
});
