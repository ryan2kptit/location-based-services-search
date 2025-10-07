import { MapPinned, History, Trash2 } from 'lucide-react';
import { useLocationHistory, useDeleteLocation } from '@/hooks/useLocations';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CurrentLocation } from '@/components/locations/CurrentLocation';
import { LocationCard } from '@/components/locations/LocationCard';
import { Empty } from '@/components/ui/Empty';
import { Skeleton } from '@/components/ui/Skeleton';

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const LocationHistoryPage = () => {
  const { data: locations, isLoading } = useLocationHistory(50);
  const { location: currentLocation } = useGeolocation();
  const deleteLocation = useDeleteLocation();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      deleteLocation.mutate(id);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom max-w-6xl">
        <div className="flex items-center space-x-3 mb-8">
          <MapPinned className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Location History
            </h1>
            <p className="text-gray-600">Track and manage your location history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Location Card */}
          <div className="lg:col-span-1">
            <CurrentLocation />
          </div>

          {/* Location History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Saved Locations
                </h2>
                {locations && locations.length > 0 && (
                  <span className="ml-auto text-sm text-gray-500">
                    {locations.length} location{locations.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : !locations || locations.length === 0 ? (
                <Empty
                  icon={<Trash2 className="h-12 w-12" />}
                  title="No location history"
                  description="Start tracking your location to see your history here"
                />
              ) : (
                <div className="space-y-4">
                  {locations.map((location) => {
                    const distance = currentLocation
                      ? calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          location.latitude,
                          location.longitude
                        )
                      : undefined;

                    return (
                      <LocationCard
                        key={location.id}
                        location={location}
                        distance={distance}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
