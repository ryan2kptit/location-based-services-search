import { useState, useEffect } from 'react';
import type { LocationCoordinates } from '@/types/location.types';
import { useLocationStore } from '@/store/locationStore';
import { GEOLOCATION_OPTIONS } from '@/utils/constants';

export const useGeolocation = (watch = false) => {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentLocation, setError: setStoreError } = useLocationStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      setError(errorMsg);
      setStoreError(errorMsg);
      setLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const coords: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      setCurrentLocation(coords);
      setError(null);
      setStoreError(null);
      setLoading(false);
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Failed to get your location';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }

      setError(errorMessage);
      setStoreError(errorMessage);
      setLoading(false);
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        GEOLOCATION_OPTIONS
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        GEOLOCATION_OPTIONS
      );
    }
  }, [watch, setCurrentLocation, setStoreError]);

  return { location, error, loading };
};
