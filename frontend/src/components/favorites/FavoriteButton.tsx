import { Heart } from 'lucide-react';
import { useAddFavorite, useRemoveFavorite, useFavorites } from '@/hooks/useFavorites';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface FavoriteButtonProps {
  serviceId: string;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  serviceId,
  className,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: favorites } = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favorite = favorites?.find((fav) => fav.serviceId === serviceId);
  const isFavorite = !!favorite;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isFavorite && favorite) {
      removeFavorite.mutate(favorite.id);
    } else {
      addFavorite.mutate(serviceId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'p-2 rounded-full transition-colors',
        isFavorite
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-400 hover:bg-gray-100',
        className
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn('h-5 w-5', isFavorite && 'fill-current')}
      />
    </button>
  );
};
