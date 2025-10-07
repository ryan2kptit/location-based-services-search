import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '@/services/favorites.service';
import { toast } from 'sonner';

export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getFavorites(),
  });
};

export const useFavoritesByType = (serviceTypeId?: string) => {
  return useQuery({
    queryKey: ['favorites', 'byType', serviceTypeId],
    queryFn: () => favoritesService.getFavoritesByType(serviceTypeId!),
    enabled: !!serviceTypeId,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => favoritesService.addFavorite(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Added to favorites!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to add to favorites'
      );
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => favoritesService.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Removed from favorites!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to remove from favorites'
      );
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      favoriteId,
      isFavorite,
    }: {
      serviceId: string;
      favoriteId?: string;
      isFavorite: boolean;
    }): Promise<void> => {
      if (isFavorite && favoriteId) {
        await favoritesService.removeFavorite(favoriteId);
      } else {
        await favoritesService.addFavorite(serviceId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(
        variables.isFavorite ? 'Removed from favorites!' : 'Added to favorites!'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update favorites');
    },
  });
};
