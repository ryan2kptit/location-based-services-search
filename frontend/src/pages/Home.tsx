import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart, Star } from 'lucide-react';
import { useServiceTypes } from '@/hooks/useServices';
import { useNearbyServices } from '@/hooks/useServices';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ServiceMap } from '@/components/services/ServiceMap';
import { ServiceCard } from '@/components/services/ServiceCard';

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: serviceTypes } = useServiceTypes();
  const { location } = useGeolocation();

  const { data: nearbyServices } = useNearbyServices({
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    radius: 5000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to services page with search query
    window.location.href = `/services?keyword=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Services Near You
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Find restaurants, shops, healthcare, and more in your local area
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-32 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <Button
                type="submit"
                variant="primary"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardBody className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Location-Based</h3>
                <p className="text-gray-600">
                  Find services near your current location with precise GPS
                  tracking
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Save Favorites</h3>
                <p className="text-gray-600">
                  Keep track of your favorite places for easy access later
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Reviews & Ratings</h3>
                <p className="text-gray-600">
                  Make informed decisions with ratings and reviews from users
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Types */}
      {serviceTypes && serviceTypes.length > 0 && (
        <section className="py-16">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {serviceTypes.map((type) => (
                <Link
                  key={type.id}
                  to={`/services?serviceTypeId=${type.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
                >
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {type.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Services */}
      {nearbyServices && nearbyServices.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Services Near You
            </h2>

            {/* Map View */}
            {location && (
              <div className="mb-8">
                <ServiceMap
                  services={nearbyServices}
                  center={[location.latitude, location.longitude]}
                  height="400px"
                />
              </div>
            )}

            {/* List View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyServices.slice(0, 6).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/services">
                <Button variant="primary" size="lg">
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
