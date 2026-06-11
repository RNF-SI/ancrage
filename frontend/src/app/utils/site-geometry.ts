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

function ringSignedArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function ringCentroid(ring: number[][]): [number, number] {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    return [ring[0][0], ring[0][1]];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

function polygonCentroid(rings: number[][][]): [number, number] {
  return ringCentroid(rings[0]);
}

export function parseStoredSitePoint(value: unknown): GeoJsonPoint | null {
  const point = parseGeoJson<GeoJsonPoint>(value as GeoJsonPoint | string | null);
  if (point?.type === 'Point' && point.coordinates.length >= 2) return point;
  return null;
}

export function parseStoredSiteGeometry(value: unknown): GeoJsonSiteGeom | null {
  const geom = parseGeoJson<GeoJsonSiteGeom>(value as GeoJsonSiteGeom | string | null);
  if (!geom) return null;
  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') return geom;
  return null;
}

export function parseGeoJsonFileContent(data: unknown): GeoJsonSiteGeom | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  const type = obj['type'];

  if (type === 'Feature') {
    return parseGeoJsonFileContent(obj['geometry']);
  }

  if (type === 'FeatureCollection') {
    for (const feature of (obj['features'] as unknown[]) ?? []) {
      const geom = parseGeoJsonFileContent(feature);
      if (geom) return geom;
    }
    return null;
  }

  if (type === 'Polygon' || type === 'MultiPolygon') {
    return data as GeoJsonSiteGeom;
  }

  return null;
}

export function computeGeometryCentroid(geom: GeoJsonSiteGeom): { lng: number; lat: number } | null {
  if (geom.type === 'Polygon') {
    const [lng, lat] = polygonCentroid(geom.coordinates);
    return isValidMapCoordinate(lat, lng) ? { lng, lat } : null;
  }

  let totalArea = 0;
  let sumLng = 0;
  let sumLat = 0;
  for (const poly of geom.coordinates) {
    const area = Math.abs(ringSignedArea(poly[0]));
    if (area === 0) continue;
    const [lng, lat] = polygonCentroid(poly);
    totalArea += area;
    sumLng += lng * area;
    sumLat += lat * area;
  }

  if (totalArea === 0) return null;
  const lng = sumLng / totalArea;
  const lat = sumLat / totalArea;
  return isValidMapCoordinate(lat, lng) ? { lng, lat } : null;
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
