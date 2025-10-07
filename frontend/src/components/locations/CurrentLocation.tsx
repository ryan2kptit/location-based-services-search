import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTrackLocation } from '@/hooks/useLocations';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const CurrentLocation: React.FC = () => {
  const { location, error, loading } = useGeolocation();
  const trackLocation = useTrackLocation();

  const handleTrackLocation = () => {
    if (location) {
      trackLocation.mutate({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Current Location
            </h3>
          </div>
          {!loading && location && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              title="Refresh location"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600">Getting your location...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : location ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Latitude</p>
                <p className="font-mono text-gray-900">
                  {location.latitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Longitude</p>
                <p className="font-mono text-gray-900">
                  {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleTrackLocation}
                isLoading={trackLocation.isPending}
              >
                Save This Location
              </Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
};
