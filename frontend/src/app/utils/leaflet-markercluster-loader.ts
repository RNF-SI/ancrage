import * as L from 'leaflet';
import 'leaflet.markercluster.esm/dist/MarkerCluster.esm.js';

if (typeof (L as any).markerClusterGroup !== 'function') {
  console.error('[Leaflet]  markerClusterGroup() non chargé !');
} else {
  console.info('[Leaflet]  markerClusterGroup() est bien chargé.');
}