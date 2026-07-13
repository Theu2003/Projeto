import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSocket } from '@/hooks/useSocket';
import { apiClient } from '@/services/api';
import { io } from 'socket.io-client';

// Mock socket.io-client
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockEmit = vi.fn();
const mockDisconnect = vi.fn();
const mockSocketInstance = {
  on: mockOn,
  off: mockOff,
  emit: mockEmit,
  disconnect: mockDisconnect,
  connected: true,
  id: 'mock-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocketInstance),
}));

vi.mock('@/services/api', () => ({
  apiClient: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing token
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('returns null socket when no token is present', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useSocket());

    expect(result.current.socket).toBeNull();
  });

  it('creates socket connection when token is present', async () => {
    const { io } = await import('socket.io-client');
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    renderHook(() => useSocket());

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket'],
        autoConnect: true,
      })
    );
  });

  it('disconnects socket on cleanup', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('provides on method that registers event listeners', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    const { result } = renderHook(() => useSocket());
    const callback = vi.fn();

    act(() => {
      result.current.on('test-event', callback);
    });

    expect(mockOn).toHaveBeenCalledWith('test-event', callback);
  });

  it('provides off method that removes event listeners', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    const { result } = renderHook(() => useSocket());
    const callback = vi.fn();

    act(() => {
      result.current.off('test-event', callback);
    });

    expect(mockOff).toHaveBeenCalledWith('test-event', callback);
  });

  it('provides emit method that sends events', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');

    const { result } = renderHook(() => useSocket());
    const data = { message: 'hello' };

    act(() => {
      result.current.emit('send-message', data);
    });

    expect(mockEmit).toHaveBeenCalledWith('send-message', data);
  });

  it('on is a no-op when socket is null', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useSocket());
    const callback = vi.fn();

    act(() => {
      result.current.on('test-event', callback);
    });

    // Should not throw, just silently do nothing
    expect(result.current.socket).toBeNull();
  });

  it('off is a no-op when socket is null', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useSocket());
    const callback = vi.fn();

    act(() => {
      result.current.off('test-event', callback);
    });

    expect(result.current.socket).toBeNull();
  });

  it('emit is a no-op when socket is null', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.emit('send-message', { data: 'test' });
    });

    expect(result.current.socket).toBeNull();
  });

  it('reconnects when token changes', () => {
    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('old-token');

    const { rerender } = renderHook(() => useSocket());

    expect(io).toHaveBeenCalledTimes(1);

    (apiClient.getToken as ReturnType<typeof vi.fn>).mockReturnValue('new-token');
    rerender();

    // Old socket should be disconnected and new one created
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
