import { useLocationHistory } from '@/hooks/useLocations';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardBody } from '@/components/ui/Card';
import { MapPin, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';

export const LocationHistory = () => {
  const { data: history, isLoading } = useLocationHistory(20);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No location history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((location) => (
        <Card key={location.id}>
          <CardBody>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-gray-900 mb-2">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <span className="font-medium">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </span>
                </div>
                {location.accuracy && (
                  <p className="text-sm text-gray-600 ml-7">
                    Accuracy: {Math.round(location.accuracy)}m
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(location.recordedAt)}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};
