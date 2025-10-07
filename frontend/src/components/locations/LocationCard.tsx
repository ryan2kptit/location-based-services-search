import { MapPin, Trash2, Calendar } from 'lucide-react';
import type { UserLocation } from '@/types/location.types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface LocationCardProps {
  location: UserLocation;
  onDelete?: (id: string) => void;
  distance?: number;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onDelete,
  distance,
  className,
}) => {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-900">
                Location #{location.id.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Coordinates:</span>{' '}
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>

              {location.accuracy && (
                <p>
                  <span className="font-medium">Accuracy:</span>{' '}
                  {location.accuracy.toFixed(0)}m
                </p>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Calendar className="h-3 w-3" />
                {formatDateTime(location.recordedAt)}
              </div>
            </div>

            {distance !== undefined && (
              <p className="text-sm text-primary-600 font-medium mt-2">
                {distance < 1000
                  ? `${Math.round(distance)}m from current location`
                  : `${(distance / 1000).toFixed(2)}km from current location`}
              </p>
            )}
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(location.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
