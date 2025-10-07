import { SearchX } from 'lucide-react';
import type { Service } from '@/types/service.types';
import { ServiceCard } from './ServiceCard';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { Empty } from '@/components/ui/Empty';
import { Pagination } from '@/components/ui/Pagination';

interface ServiceListProps {
  services: Service[];
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  loading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Empty
        icon={<SearchX className="h-16 w-16" />}
        title="No services found"
        description="Try adjusting your search filters or search in a different area"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {onPageChange && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
