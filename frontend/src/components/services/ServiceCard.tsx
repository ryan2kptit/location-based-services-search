import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import type { Service } from '@/types/service.types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { formatDistance, truncateText } from '@/utils/formatters';

interface ServiceCardProps {
  service: Service;
  showDistance?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  showDistance = true,
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardBody>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <Link to={`/services/${service.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors truncate">
                {service.name}
              </h3>
            </Link>
            <Badge variant="primary" className="mt-1 text-xs">
              {service.serviceTypeName || service.serviceType?.name || 'Unknown'}
            </Badge>
          </div>
          <FavoriteButton serviceId={service.id} />
        </div>

        {service.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateText(service.description, 100)}
          </p>
        )}

        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-start space-x-2 text-gray-700">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">{service.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-3">
            {service.rating !== undefined ? (
              <Rating
                value={service.rating}
                showCount={true}
                count={service.reviewCount}
                size="sm"
              />
            ) : (
              <span className="text-xs text-gray-500">No rating yet</span>
            )}
          </div>

          {showDistance && service.distance !== undefined && (
            <div className="text-sm font-medium text-primary-600">
              {formatDistance(service.distance)}
            </div>
          )}
        </div>

        <Link to={`/services/${service.id}`}>
          <Button variant="outline" size="sm" className="w-full mt-3">
            View Details
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
};
