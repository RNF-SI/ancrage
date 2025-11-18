import * as L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';

if (typeof (L as any).markerClusterGroup !== 'function') {
  console.error('[Leaflet]  markerClusterGroup() non chargé !');
} else {
  console.info('[Leaflet]  markerClusterGroup() est bien chargé.');
}