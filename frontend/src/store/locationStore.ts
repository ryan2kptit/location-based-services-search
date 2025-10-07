import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationCoordinates } from '@/types/location.types';

interface LocationState {
  currentLocation: LocationCoordinates | null;
  isTracking: boolean;
  error: string | null;
  setCurrentLocation: (location: LocationCoordinates) => void;
  setTracking: (isTracking: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentLocation: null,
      isTracking: false,
      error: null,
      setCurrentLocation: (location) =>
        set({ currentLocation: location, error: null }),
      setTracking: (isTracking) => set({ isTracking }),
      setError: (error) => set({ error }),
      clearLocation: () =>
        set({ currentLocation: null, isTracking: false, error: null }),
    }),
    {
      name: 'location-storage',
    }
  )
);
