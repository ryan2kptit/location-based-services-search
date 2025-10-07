export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface TrackLocationDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  recordedAt: string;
  createdAt: string;
}

export interface NearbyUser {
  userId: string;
  username: string;
  distance: number; // in meters
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}
