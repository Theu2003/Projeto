import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface Position {
  latitude: number;
  longitude: number;
}

interface Marker {
  id: string;
  position: Position;
  title: string;
  status: 'pending' | 'accepted' | 'on_the_way' | 'completed' | 'cancelled' | 'rescheduled';
}

interface Route {
  origin: Position;
  destination: Position;
}

interface MapViewProps {
  center: Position | null;
  markers?: Marker[];
  route?: Route;
}

const statusColors: Record<Marker['status'], string> = {
  pending: 'bg-yellow-500',
  accepted: 'bg-blue-500',
  on_the_way: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  rescheduled: 'bg-orange-500',
};

export function MapView({ center, markers = [], route }: MapViewProps) {
  const { location } = useGoogleMaps();

  if (!center && !location) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div
      data-testid="map-container"
      className="relative h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Google Maps Integration</p>
      </div>

      {markers.map((marker) => (
        <div
          key={marker.id}
          data-testid={`marker-${marker.id}`}
          className={`absolute w-3 h-3 rounded-full ${statusColors[marker.status]}`}
          style={{
            left: `${((marker.position.longitude + 50) % 100)}%`,
            top: `${((marker.position.latitude + 30) % 100)}%`,
          }}
          title={marker.title}
        />
      ))}

      <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow text-xs">
        <span className="text-gray-600 dark:text-gray-300">{markers.length} markers</span>
        {route && (
          <span className="ml-2 text-green-600 dark:text-green-400">Route active</span>
        )}
      </div>
    </div>
  );
}
