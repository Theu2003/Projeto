import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { Notification } from '@/types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { on, off } = useSocket();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleNewNotification(...args: unknown[]) {
      const notification = args[0] as Notification;
      setNotifications((prev) => [notification, ...prev]);
    }

    on('notification:new', handleNewNotification);
    return () => {
      off('notification:new', handleNewNotification);
    };
  }, [on, off]);

  async function loadNotifications() {
    try {
      const data = await apiClient.get<Notification[]>('/notifications');
      setNotifications(data);
    } catch {
      // notifications will remain empty
    }
  }

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  }, []);

  return { notifications, markAsRead };
}
