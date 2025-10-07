import { useFavorites } from '@/hooks/useFavorites';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Spinner } from '@/components/ui/Spinner';

export const FavoritesList = () => {
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No favorites yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Start adding services to your favorites to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((favorite) => (
        <ServiceCard key={favorite.id} service={favorite.service} />
      ))}
    </div>
  );
};
