import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService } from '@/services/services.service';
import type {
  SearchServicesParams,
  NearbyServicesParams,
  CreateServiceDto,
  UpdateServiceDto,
} from '@/types/service.types';
import { toast } from 'sonner';

export const useServices = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['services', page, limit],
    queryFn: () => servicesService.getAllServices(page, limit),
  });
};

export const useSearchServices = (params: SearchServicesParams) => {
  return useQuery({
    queryKey: ['services', 'search', params],
    queryFn: () => servicesService.searchServices(params),
    enabled: !!(params.latitude && params.longitude),
  });
};

export const useNearbyServices = (params: NearbyServicesParams) => {
  return useQuery({
    queryKey: ['services', 'nearby', params],
    queryFn: () => servicesService.getNearbyServices(params),
    enabled: !!(params.latitude && params.longitude),
  });
};

export const useServiceTypes = () => {
  return useQuery({
    queryKey: ['serviceTypes'],
    queryFn: () => servicesService.getServiceTypes(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useService = (id: string) => {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesService.getServiceById(id),
    enabled: !!id,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDto) =>
      servicesService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create service');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
      servicesService.updateService(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', variables.id] });
      toast.success('Service updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update service');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    },
  });
};
