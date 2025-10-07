import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsService } from '@/services/locations.service';
import type { TrackLocationDto } from '@/types/location.types';
import { toast } from 'sonner';

export const useTrackLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TrackLocationDto) =>
      locationsService.trackLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLocation'] });
      queryClient.invalidateQueries({ queryKey: ['locationHistory'] });
      toast.success('Location tracked successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to track location'
      );
    },
  });
};

export const useCurrentLocation = () => {
  return useQuery({
    queryKey: ['currentLocation'],
    queryFn: () => locationsService.getCurrentLocation(),
    retry: 1,
  });
};

export const useLocationHistory = (limit = 50) => {
  return useQuery({
    queryKey: ['locationHistory', limit],
    queryFn: () => locationsService.getLocationHistory(limit),
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => locationsService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationHistory'] });
      toast.success('Location deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete location');
    },
  });
};

export const useNearbyUsers = (
  latitude: number,
  longitude: number,
  radius = 1000
) => {
  return useQuery({
    queryKey: ['nearbyUsers', latitude, longitude, radius],
    queryFn: () => locationsService.getNearbyUsers(latitude, longitude, radius),
    enabled: !!(latitude && longitude),
  });
};
