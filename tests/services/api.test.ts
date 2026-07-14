import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/services/api';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('should store token in localStorage', () => {
      apiClient.setToken('test-token-123');
      expect(localStorage.getItem('token')).toBe('test-token-123');
    });

    it('should retrieve token from localStorage', () => {
      localStorage.setItem('token', 'stored-token');
      const token = apiClient.getToken();
      expect(token).toBe('stored-token');
    });

    it('should clear token from localStorage', () => {
      localStorage.setItem('token', 'token-to-clear');
      apiClient.clearToken();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should return null when no token exists', () => {
      const token = apiClient.getToken();
      expect(token).toBeNull();
    });
  });

  describe('Base URL Configuration', () => {
    it('should have default base URL', () => {
      expect(apiClient.getBaseUrl()).toBe('http://localhost:3001/api');
    });
  });

  describe('Request Interceptor', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('token', 'auth-token-123');
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.get('/test');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token-123',
          }),
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.get('/test');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      } as Response);

      const result = await apiClient.get('/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should make POST request', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1' }),
      } as Response);

      const result = await apiClient.post('/test', { name: 'test' });
      expect(result).toEqual({ id: '1' });
    });

    it('should make PUT request', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ updated: true }),
      } as Response);

      const result = await apiClient.put('/test', { name: 'updated' });
      expect(result).toEqual({ updated: true });
    });

    it('should make DELETE request', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      } as Response);

      const result = await apiClient.delete('/test');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('Error Handling', () => {
    it('should throw error on non-ok response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Unauthorized');
    });

    it('should clear token on 401 response', async () => {
      localStorage.setItem('token', 'expired-token');
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(apiClient.get('/test')).rejects.toThrow();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
