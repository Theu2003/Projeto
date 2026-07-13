import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { getSocket, disconnectSocket } from '@/services/socket';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = apiClient.getToken();

  useEffect(() => {
    if (token) {
      const newSocket = getSocket(token);
      setSocket(newSocket);
    } else {
      disconnectSocket();
      setSocket(null);
    }

    return () => {
      disconnectSocket();
      setSocket(null);
    };
  }, [token]);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    socket?.on(event, callback);
  }, [socket]);

  const off = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    socket?.off(event, callback);
  }, [socket]);

  const emit = useCallback((event: string, data?: unknown) => {
    socket?.emit(event, data);
  }, [socket]);

  return { on, off, emit, socket };
}
