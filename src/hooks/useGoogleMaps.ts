import { useState, useCallback } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

interface UseGoogleMapsReturn {
  location: Location | null;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null);
          resolve();
        },
        (err) => {
          setError(err.message);
          resolve();
        }
      );
    });
  }, []);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  return { location, error, getCurrentLocation, calculateDistance };
}
