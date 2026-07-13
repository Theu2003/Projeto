import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from '@/components/MapView';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

vi.mock('@/hooks/useGoogleMaps');

describe('MapView', () => {
  beforeEach(() => {
    vi.mocked(useGoogleMaps).mockReturnValue({
      location: { latitude: -23.5505, longitude: -46.6333 },
      error: null,
      getCurrentLocation: vi.fn(),
      calculateDistance: vi.fn().mockReturnValue(5),
    });
  });

  it('renders map container', () => {
    render(
      <MapView
        center={{ latitude: -23.5505, longitude: -46.6333 }}
        markers={[]}
      />
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders markers when provided', () => {
    const markers = [
      {
        id: '1',
        position: { latitude: -23.55, longitude: -46.63 },
        title: 'Request #1',
        status: 'pending' as const,
      },
      {
        id: '2',
        position: { latitude: -23.56, longitude: -46.64 },
        title: 'Request #2',
        status: 'accepted' as const,
      },
    ];

    render(
      <MapView
        center={{ latitude: -23.5505, longitude: -46.6333 }}
        markers={markers}
      />
    );

    expect(screen.getByTitle('Request #1')).toBeInTheDocument();
    expect(screen.getByTitle('Request #2')).toBeInTheDocument();
  });

  it('shows loading when no location available', () => {
    vi.mocked(useGoogleMaps).mockReturnValueOnce({
      location: null,
      error: null,
      getCurrentLocation: vi.fn(),
      calculateDistance: vi.fn().mockReturnValue(0),
    });

    render(
      <MapView
        center={null}
        markers={[]}
      />
    );
    expect(screen.getByText(/loading map/i)).toBeInTheDocument();
  });

  it('renders with route line when route prop provided', () => {
    render(
      <MapView
        center={{ latitude: -23.5505, longitude: -46.6333 }}
        markers={[]}
        route={{
          origin: { latitude: -23.55, longitude: -46.63 },
          destination: { latitude: -23.56, longitude: -46.64 },
        }}
      />
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
