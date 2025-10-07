import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map, List, MapPin } from 'lucide-react';
import { useSearchServices } from '@/hooks/useServices';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ServiceList } from '@/components/services/ServiceList';
import { ServiceMap } from '@/components/services/ServiceMap';
import { ServiceFilters } from '@/components/services/ServiceFilters';
import type { FilterValues } from '@/components/services/ServiceFilters';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export const Services = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  const [filters, setFilters] = useState<FilterValues>({
    keyword: searchParams.get('keyword') || undefined,
    serviceTypeId: searchParams.get('serviceTypeId') || undefined,
    radius: 5000,
  });

  const { data: servicesData, isLoading } = useSearchServices({
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    ...filters,
  });

  const services = servicesData?.data || [];

  useEffect(() => {
    const keyword = searchParams.get('keyword');
    const serviceTypeId = searchParams.get('serviceTypeId');
    if (keyword || serviceTypeId) {
      setFilters((prev) => ({
        ...prev,
        keyword: keyword || undefined,
        serviceTypeId: serviceTypeId || undefined,
      }));
    }
  }, [searchParams]);

  const handleFilter = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Services
          </h1>
          <p className="text-gray-600">
            Discover services near your location
          </p>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Location Access Required</h3>
                <p className="text-sm text-yellow-700 mt-1">{locationError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Enable Location
                </Button>
              </div>
            </div>
          </div>
        )}

        {location && (
          <Card className="mb-6">
            <CardBody className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span>
                    Searching near: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/location-history')}
                >
                  View Location History
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ServiceFilters onFilter={handleFilter} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* View Toggle */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  {services?.length || 0} service{services?.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Map
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            {locationLoading ? (
              <Card>
                <CardBody className="py-12 text-center">
                  <p className="text-gray-600">Getting your location...</p>
                </CardBody>
              </Card>
            ) : !location ? (
              <Card>
                <CardBody className="py-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Please enable location access to view services near you
                  </p>
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    Enable Location
                  </Button>
                </CardBody>
              </Card>
            ) : viewMode === 'list' ? (
              <ServiceList services={services || []} loading={isLoading} />
            ) : (
              <ServiceMap
                services={services || []}
                center={[location.latitude, location.longitude]}
                height="600px"
                showUserLocation={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
