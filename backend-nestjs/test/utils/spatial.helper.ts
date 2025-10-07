import { Point } from 'geojson';

export class SpatialHelper {
  /**
   * Create a MySQL POINT from latitude and longitude
   */
  static createPoint(latitude: number, longitude: number): Point {
    return {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON uses [lng, lat]
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if a point is within radius of another point
   */
  static isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusInMeters: number,
  ): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusInMeters;
  }

  /**
   * Generate coordinates offset by distance in meters
   */
  static offsetCoordinates(
    latitude: number,
    longitude: number,
    offsetMeters: number,
    bearing: number = 0,
  ): { latitude: number; longitude: number } {
    const R = 6371e3; // Earth's radius in meters
    const δ = offsetMeters / R; // Angular distance
    const θ = (bearing * Math.PI) / 180; // Bearing in radians

    const φ1 = (latitude * Math.PI) / 180;
    const λ1 = (longitude * Math.PI) / 180;

    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
    );

    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
      );

    return {
      latitude: (φ2 * 180) / Math.PI,
      longitude: (λ2 * 180) / Math.PI,
    };
  }

  /**
   * Create test points around a center location at specified distances
   */
  static createTestPointsAround(
    centerLat: number,
    centerLng: number,
    distances: number[],
  ): Array<{ latitude: number; longitude: number; distance: number }> {
    const points: Array<{ latitude: number; longitude: number; distance: number }> = [];

    distances.forEach((distance, index) => {
      const bearing = (index * 360) / distances.length; // Distribute evenly in a circle
      const coords = this.offsetCoordinates(centerLat, centerLng, distance, bearing);
      points.push({
        ...coords,
        distance,
      });
    });

    return points;
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(
    latitude: number,
    longitude: number,
    precision: number = 6,
  ): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  /**
   * Create a bounding box around a point
   */
  static createBoundingBox(
    latitude: number,
    longitude: number,
    radiusInMeters: number,
  ): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const north = this.offsetCoordinates(latitude, longitude, radiusInMeters, 0);
    const south = this.offsetCoordinates(latitude, longitude, radiusInMeters, 180);
    const east = this.offsetCoordinates(latitude, longitude, radiusInMeters, 90);
    const west = this.offsetCoordinates(latitude, longitude, radiusInMeters, 270);

    return {
      minLat: south.latitude,
      maxLat: north.latitude,
      minLng: west.longitude,
      maxLng: east.longitude,
    };
  }

  /**
   * Mock ST_Distance query result
   */
  static mockSTDistanceResult(distance: number): any[] {
    return [{ distance: distance.toString() }];
  }

  /**
   * Mock ST_DWithin query results
   */
  static mockSTDWithinResults(
    services: any[],
    centerLat: number,
    centerLng: number,
  ): any[] {
    return services.map((service) => ({
      ...service,
      distance: this.calculateDistance(
        centerLat,
        centerLng,
        service.latitude,
        service.longitude,
      ),
    }));
  }

  /**
   * Create SQL for ST_Distance
   */
  static createSTDistanceSQL(
    lon: number,
    lat: number,
    alias: string = 's',
  ): string {
    return `ST_Distance(
      ${alias}.location::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
    )`;
  }

  /**
   * Create SQL for ST_DWithin
   */
  static createSTDWithinSQL(
    lon: number,
    lat: number,
    radius: number,
    alias: string = 's',
  ): string {
    return `ST_DWithin(
      ${alias}.location::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radius}
    )`;
  }
}
