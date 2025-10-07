import { useState } from 'react';
import { Heart, Map as MapIcon, List } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useServiceTypes } from '@/hooks/useServices';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceMap } from '@/components/services/ServiceMap';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import type { Service } from '@/types/service.types';

type SortOption = 'recent' | 'distance' | 'rating' | 'name';

export const Favorites = () => {
  const { data: favorites, isLoading } = useFavorites();
  const { data: serviceTypes } = useServiceTypes();
  const { location } = useGeolocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const services: Service[] = favorites?.map((fav) => fav.service) || [];

  // Filter by type
  const filteredServices = selectedType === 'all'
    ? services
    : services.filter((s) => s.serviceTypeId === selectedType);

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return 0; // Keep original order (most recent first)
    }
  });

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-primary-600 fill-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600">
                {favorites?.length || 0} saved service{favorites?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Service Type Filter */}
            <Tabs defaultValue="all" value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                {serviceTypes?.slice(0, 4).map((type) => (
                  <TabsTrigger key={type.id} value={type.id}>
                    {type.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="recent">Recently Added</option>
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="name">Name</option>
              </select>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === 'map'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedServices.length === 0 ? (
          <Empty
            icon={<Heart className="h-16 w-16" />}
            title={selectedType === 'all' ? 'No favorites yet' : 'No favorites in this category'}
            description={
              selectedType === 'all'
                ? 'Start adding services to your favorites to see them here'
                : 'You haven\'t favorited any services in this category yet'
            }
            action={
              <Button variant="primary" onClick={() => window.location.href = '/services'}>
                Browse Services
              </Button>
            }
          />
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                showDistance={!!location}
              />
            ))}
          </div>
        ) : (
          <ServiceMap
            services={sortedServices}
            center={location ? [location.latitude, location.longitude] : undefined}
            height="600px"
            showUserLocation={!!location}
          />
        )}
      </div>
    </div>
  );
};
