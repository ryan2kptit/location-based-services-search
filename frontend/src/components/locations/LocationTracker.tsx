import { useEffect } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTrackLocation } from '@/hooks/useLocations';
import { useAuthStore } from '@/store/authStore';

export const LocationTracker = () => {
  const { isAuthenticated } = useAuthStore();
  const { location, error, loading } = useGeolocation(false);
  const trackLocation = useTrackLocation();

  useEffect(() => {
    if (location && isAuthenticated && !error) {
      trackLocation.mutate({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-gray-900">Location Status</span>
        </div>

        {loading && (
          <span className="text-sm text-gray-600">Detecting location...</span>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <X className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {location && !error && (
          <div className="flex items-center space-x-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Location detected</span>
          </div>
        )}
      </div>

      {location && (
        <div className="mt-3 text-sm text-gray-600">
          <p>
            Latitude: {location.latitude.toFixed(6)}, Longitude:{' '}
            {location.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};
