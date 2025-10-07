import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Share2, Navigation } from 'lucide-react';
import { useService } from '@/hooks/useServices';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { ServiceMap } from '@/components/services/ServiceMap';
import { LoadingPage } from '@/components/ui/Spinner';
import { formatDistance } from '@/utils/formatters';
import { toast } from 'sonner';

export const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: service, isLoading } = useService(id!);
  const { location } = useGeolocation();

  const handleShare = async () => {
    const shareData = {
      title: service?.name,
      text: `Check out ${service?.name} on our service directory`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading service details..." />;
  }

  if (!service) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Service not found
        </h2>
        <Link to="/services">
          <Button variant="primary">Back to Services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        <Link to="/services" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {service.name}
                    </h1>
                    <Badge variant="primary">{service.serviceType.name}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <FavoriteButton serviceId={service.id} />
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                {service.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      About
                    </h3>
                    <p className="text-gray-700">{service.description}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-700">{service.address}</p>
                      {service.distance !== undefined && location && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDistance(service.distance)} from your location
                        </p>
                      )}
                    </div>
                  </div>

                  {service.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <a
                          href={`tel:${service.phoneNumber}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {service.phoneNumber}
                        </a>
                      </div>
                    </div>
                  )}

                  {service.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a
                          href={`mailto:${service.email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {service.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {service.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Website</p>
                        <a
                          href={service.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {service.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {service.rating !== undefined && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Rating & Reviews
                    </h3>
                    <Rating
                      value={service.rating}
                      showCount={true}
                      count={service.reviewCount}
                      size="lg"
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar - Map */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              </CardHeader>
              <CardBody className="p-0">
                <ServiceMap
                  services={[service]}
                  center={[service.latitude, service.longitude]}
                  zoom={15}
                  height="400px"
                />
              </CardBody>
            </Card>

            <div className="mt-6 space-y-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="primary" className="w-full">
                  <Navigation className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
              </a>

              {service.phoneNumber && (
                <a href={`tel:${service.phoneNumber}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
