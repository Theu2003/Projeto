import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useGoogleMaps', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading false and no location', () => {
    const { result } = renderHook(() => useGoogleMaps());
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns location on successful geolocation', async () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => JSON.parse(JSON.stringify(mockPosition)),
    };
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGoogleMaps());

    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.location).toEqual({
      latitude: -23.5505,
      longitude: -46.6333,
    });
    expect(result.current.error).toBeNull();
  });

  it('sets error when geolocation fails', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: 'User denied geolocation', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
      }
    );

    const { result } = renderHook(() => useGoogleMaps());

    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('User denied geolocation');
  });

  it('sets error when geolocation is not supported', async () => {
    // Temporarily remove geolocation
    const original = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', { value: undefined, writable: true });

    const { result } = renderHook(() => useGoogleMaps());

    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.error).toBe('Geolocation is not supported by this browser');

    // Restore
    Object.defineProperty(navigator, 'geolocation', { value: original, writable: true });
  });

  it('calculates distance between two points', () => {
    const { result } = renderHook(() => useGoogleMaps());

    // São Paulo to Rio de Janeiro (approx 430km)
    const distance = result.current.calculateDistance(
      -23.5505, -46.6333,
      -22.9068, -43.1729
    );
    expect(distance).toBeGreaterThan(350);
    expect(distance).toBeLessThan(500);
  });

  it('returns 0 for same point distance', () => {
    const { result } = renderHook(() => useGoogleMaps());
    const distance = result.current.calculateDistance(
      -23.5505, -46.6333,
      -23.5505, -46.6333
    );
    expect(distance).toBe(0);
  });
});
