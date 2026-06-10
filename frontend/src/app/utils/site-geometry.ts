import { GeoJsonPoint, GeoJsonSiteGeom } from '@app/interfaces/site.interface';
import { Site } from '@app/models/site.model';

function parseGeoJson<T>(value: T | string | null | undefined): T | null {
  if (!value) return null;

  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }

  return parsed as T;
}

export function getSitePolygonGeometry(site: Site): GeoJsonSiteGeom | null {
  const geom = parseGeoJson<GeoJsonSiteGeom>(site.geom);
  if (!geom) return null;
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    return geom;
  }
  return null;
}

function isValidMapCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) return false;
  return true;
}

export function getSitePointCoordinates(site: Site): { lat: number; lng: number } | null {
  const point = parseGeoJson<GeoJsonPoint>(site.geom_pt);
  if (point?.type === 'Point' && point.coordinates.length >= 2) {
    const [lng, lat] = point.coordinates.map(Number);
    if (isValidMapCoordinate(lat, lng)) {
      return { lat, lng };
    }
  }

  const lat = parseFloat(site.position_y);
  const lng = parseFloat(site.position_x);
  if (isValidMapCoordinate(lat, lng)) {
    return { lat, lng };
  }

  return null;
}
