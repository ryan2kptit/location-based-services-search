import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon, divIcon, LatLngBounds } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import type { Service } from '@/types/service.types';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_TILE_URL,
  MAP_ATTRIBUTION,
} from '@/utils/constants';
import { formatDistance } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for different service types
const createCustomIcon = (color: string) => {
  return divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 8px; color: white; font-size: 16px;">📍</div></div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Current location icon (blue dot)
const currentLocationIcon = divIcon({
  html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>',
  className: 'current-location-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface FitBoundsProps {
  services: Service[];
  userLocation?: [number, number];
}

const FitBounds: React.FC<FitBoundsProps> = ({ services, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (services.length > 0) {
      const bounds = new LatLngBounds(
        services.map((s) => [s.latitude, s.longitude])
      );
      if (userLocation) {
        bounds.extend(userLocation);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }
  }, [services, userLocation, map]);

  return null;
};

interface ServiceMapProps {
  services: Service[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showUserLocation?: boolean;
}

export const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  height = '500px',
  showUserLocation = true,
}) => {
  const getMarkerColor = (serviceType: string): string => {
    const colors: Record<string, string> = {
      Restaurant: '#ef4444',
      Hospital: '#3b82f6',
      School: '#f59e0b',
      Shop: '#8b5cf6',
      Park: '#10b981',
      default: '#6366f1',
    };
    return colors[serviceType] || colors.default;
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} />
        <FitBounds services={services} userLocation={showUserLocation ? center : undefined} />

        {/* User Location Marker */}
        {showUserLocation && (
          <>
            <Marker position={center} icon={currentLocationIcon}>
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-blue-600">Your Location</p>
                  <p className="text-sm text-gray-600">
                    {center[0].toFixed(6)}, {center[1].toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={center}
              radius={100}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          </>
        )}

        {/* Service Markers */}
        {services.map((service) => (
          <Marker
            key={service.id}
            position={[service.latitude, service.longitude]}
            icon={createCustomIcon(getMarkerColor(service.serviceType.name))}
          >
            <Popup maxWidth={300} minWidth={250}>
              <div className="p-2">
                <div className="mb-2">
                  <Link
                    to={`/services/${service.id}`}
                    className="font-bold text-primary-600 hover:text-primary-700 text-lg"
                  >
                    {service.name}
                  </Link>
                  <Badge variant="primary" className="ml-2 text-xs">
                    {service.serviceType.name}
                  </Badge>
                </div>

                {service.rating !== undefined && (
                  <div className="mb-2">
                    <Rating
                      value={service.rating}
                      showCount={true}
                      count={service.reviewCount}
                      size="sm"
                    />
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-2 flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {service.address}
                </p>

                {service.distance !== undefined && (
                  <p className="text-sm text-primary-600 font-medium mb-3">
                    {formatDistance(service.distance)} away
                  </p>
                )}

                <div className="flex gap-2">
                  <Link to={`/services/${service.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
