import * as L from 'leaflet';

declare module 'leaflet' {
  export function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;

  export interface MarkerClusterGroupOptions extends L.LayerOptions {
    maxClusterRadius?: number | ((zoom: number) => number);
    iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon;
    spiderfyOnEveryZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    singleMarkerMode?: boolean;
    disableClusteringAtZoom?: number;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    chunkedLoading?: boolean;
    chunkInterval?: number;
    chunkDelay?: number;
    chunkProgress?: (processed: number, total: number, elapsed: number) => void;
  }

  export interface MarkerClusterGroup extends L.Layer {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getBounds(): L.LatLngBounds;
    getLayers(): L.Layer[];
    getVisibleParent(marker: L.Marker): L.Marker | null;
    hasLayer(layer: L.Layer): boolean;
    zoomToShowLayer(layer: L.Layer, callback?: () => void): void;
  }

  export interface MarkerCluster extends L.Marker {
    getAllChildMarkers(): L.Marker[];
    getChildCount(): number;
    getClusterBounds(): L.LatLngBounds;
  }
}