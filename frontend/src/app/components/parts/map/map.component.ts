import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  input,
  output,
  effect,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Site } from '@app/models/site.model';
import { Labels } from '@app/utils/labels';
import { GeoJsonPoint, GeoJsonSiteGeom } from '@app/interfaces/site.interface';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@bluehalo/ngx-leaflet-markercluster';
import html2canvas from 'html2canvas';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import {
  computeGeometryCentroid,
  getSitePointCoordinates,
  getSitePolygonGeometry,
  parseGeoJsonFileContent,
  parseStoredSiteGeometry,
  parseStoredSitePoint,
} from '@app/utils/site-geometry';
import '@app/utils/leaflet-markercluster-loader';

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultMarkerIcon;
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, LeafletModule, LeafletMarkerClusterModule]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  readonly sites = input<Site[]>([]);
  readonly changePosition = input<boolean>(false);
  readonly formGroup = input<FormGroup>(new FormGroup({}));
  readonly siteForEdit = input<Site | null>(null);
  readonly mapId = input<string>('map');
  private readonly formRevision = signal(0);
  private formGroupSubscription?: Subscription;
  readonly actors = input<Acteur[]>([]);
  readonly siteDiagnosticActions = input(false);
  readonly currentUserId = input(0);
  readonly openDiagnostic = output<{ id: number; slug: string; site: Site }>();
  readonly createDiagnostic = output<Site>();
  readonly editSite = output<Site>();
  private readonly mapReady = signal(false);
  private markerClusterGroup: L.MarkerClusterGroup | undefined;
  private siteLayersGroup: L.FeatureGroup | undefined;
  private resizeObserver?: ResizeObserver;
  private resizeDebounceId?: ReturnType<typeof setTimeout>;
  private lastFittedSitesKey = '';
  private lastFittedActorsKey = '';
  marker: L.Marker | undefined;
  private mapClickListener: ((e: L.LeafletMouseEvent) => void) | undefined;
  private editGeometryLayer: L.GeoJSON | undefined;
  private lastSyncedEditGeomKey = '';
  readonly siteDrawMode = signal<'point' | 'polygon'>('point');
  labels = new Labels();
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('geoJsonInput') geoJsonInput?: ElementRef<HTMLInputElement>;
  private readonly toaster = inject(ToastrService);

  constructor() {
    effect(() => {
      if (!this.mapReady() || this.changePosition()) return;
      this.currentUserId();
      this.syncMapContent();
    });

    effect(onCleanup => {
      const fg = this.formGroup();
      this.formGroupSubscription?.unsubscribe();
      this.formGroupSubscription = fg.valueChanges.subscribe(() => {
        this.formRevision.update(v => v + 1);
      });
      onCleanup(() => this.formGroupSubscription?.unsubscribe());
      this.formRevision.update(v => v + 1);
    });

    effect(() => {
      if (!this.changePosition() || !this.mapReady()) return;
      this.formRevision();
      this.siteForEdit();
      this.syncSiteEditGeometry();
    });
  }

  private editGeometryKey(geom: GeoJsonSiteGeom | null, geomPt: GeoJsonPoint | null): string {
    return `${geom ? JSON.stringify(geom) : ''}|${geomPt ? JSON.stringify(geomPt) : ''}`;
  }

  private syncSiteEditGeometry(): void {
    if (!this.map || !this.formGroup()) return;

    const fg = this.formGroup();
    const site = this.siteForEdit();
    let geom = parseStoredSiteGeometry(fg.get('geom')?.value);
    let geomPt = parseStoredSitePoint(fg.get('geom_pt')?.value);

    if (!geom && site) {
      geom = getSitePolygonGeometry(site);
    }
    if (!geomPt && site) {
      geomPt = parseStoredSitePoint(site.geom_pt);
    }

    const geomKey = this.editGeometryKey(geom, geomPt);
    if (geomKey === this.lastSyncedEditGeomKey) return;

    this.lastSyncedEditGeomKey = geomKey;

    if (geom) {
      this.showPolygonEditGeometry(geom, geomPt, true);
      return;
    }

    this.siteDrawMode.set('point');
    this.clearEditGeometryLayer();

    const coords = geomPt
      ? { lat: geomPt.coordinates[1], lng: geomPt.coordinates[0] }
      : getSitePointCoordinates(site ?? new Site());
    if (coords) {
      this.marker?.remove();
      this.marker = L.marker([coords.lat, coords.lng], { draggable: false }).addTo(this.map);
      this.map.setView([coords.lat, coords.lng], 13, { animate: false });
    }
  }

  private syncMapContent(): void {
    const actors = this.actors();
    const sites = this.sites();

    if (actors.length > 0 && sites.length > 0) {
      this.renderActorMarkersWithSiteOverlay();
      return;
    }
    if (actors.length > 0) {
      this.siteLayersGroup?.clearLayers();
      this.renderActorMarkers();
      return;
    }
    if (sites.length > 0) {
      this.renderSiteMarkers();
    }
  }

  private readonly overlaySitePolygonStyle: L.PathOptions = {
    color: '#e65100',
    weight: 2,
    fillColor: '#ff9800',
    fillOpacity: 0.25,
  };

  private addSitePointLayer(
    site: Site,
    popup: string,
    coords: { lat: number; lng: number },
    bounds: L.LatLngBounds,
    useSiteLayersGroup: boolean,
    bindActions: boolean
  ): void {
    const marker = L.marker([coords.lat, coords.lng]).bindPopup(popup);

    if (bindActions) {
      this.bindSitePopupActions(marker, site);
    }

    if (useSiteLayersGroup) {
      this.siteLayersGroup?.addLayer(marker);
    } else {
      this.markerClusterGroup?.addLayer(marker);
    }

    bounds.extend([coords.lat, coords.lng]);
  }

  private renderSiteGeometriesOverlay(bounds: L.LatLngBounds): number {
    if (!this.siteLayersGroup) return 0;

    let featureCount = 0;
    this.siteLayersGroup.clearLayers();

    for (const site of this.sites()) {
      const popup = this.buildSitePopup(site);
      const polygon = getSitePolygonGeometry(site);
      const coords = getSitePointCoordinates(site);

      if (polygon) {
        const layer = L.geoJSON(polygon as GeoJSON.GeoJsonObject, {
          style: this.overlaySitePolygonStyle,
          onEachFeature: (_feature, geoLayer) => {
            geoLayer.bindPopup(popup);
          },
        });
        this.siteLayersGroup.addLayer(layer);
        bounds.extend(layer.getBounds());
        featureCount++;
      }

      if (coords) {
        this.addSitePointLayer(site, popup, coords, bounds, true, false);
        if (!polygon) {
          featureCount++;
        }
      }
    }

    return featureCount;
  }

  private renderActorMarkersWithSiteOverlay(): void {
    if (!this.map || !this.markerClusterGroup) return;

    const bounds = L.latLngBounds([]);
    const siteFeatureCount = this.renderSiteGeometriesOverlay(bounds);
    let actorCount = 0;

    this.markerClusterGroup.clearLayers();

    for (const actor of this.actors()) {
      if (!actor.commune?.latitude || !actor.commune?.longitude) continue;

      const lat = parseFloat(actor.commune.latitude);
      const lng = parseFloat(actor.commune.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const marker = L.marker([lat, lng]);
      const categories = actor.categories?.map(c => c.libelle).join(', ') ?? '';

      marker.bindPopup(`
        <strong>${actor.nom} ${actor.prenom}</strong><br>
        ${this.labels.statusLabel} : ${actor.fonction}<br>
        ${this.labels.category} : ${categories}<br>
        ${this.labels.telephone} : ${actor.telephone}<br>
        ${this.labels.mail} : ${actor.mail}<br>
        ${this.labels.town} : ${actor.commune.nom_com}<br>
        ${this.labels.profile} : ${actor.profil?.libelle}<br>
        ${this.labels.structure} : ${actor.structure}<br>
      `);

      this.markerClusterGroup.addLayer(marker);
      bounds.extend([lat, lng]);
      actorCount++;
    }

    const overlayKey = `${this.entitiesKey(this.sites().map(site => site.id_site))}|${this.entitiesKey(this.actors().map(actor => actor.id_acteur))}`;
    const totalFeatures = siteFeatureCount + actorCount;
    if (overlayKey !== this.lastFittedActorsKey && totalFeatures > 0) {
      this.fitMapToBounds(bounds, totalFeatures);
      this.lastFittedActorsKey = overlayKey;
      this.lastFittedSitesKey = overlayKey;
    }
  }

  private fitMapToBounds(bounds: L.LatLngBounds, featureCount: number, singleCoords?: { lat: number; lng: number }): void {
    if (!this.map || featureCount === 0) return;

    const viewOptions: L.ZoomPanOptions = { animate: false };

    if (featureCount === 1 && singleCoords) {
      this.map.setView([singleCoords.lat, singleCoords.lng], 10, viewOptions);
      return;
    }

    if (!bounds.isValid()) return;

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const latSpan = northEast.lat - southWest.lat;
    const lngSpan = northEast.lng - southWest.lng;

    // Évite un fitBounds mondial si une coordonnée est aberrante
    if (latSpan > 25 || lngSpan > 40) {
      this.map.setView([46.8, 2.5], 6, viewOptions);
      return;
    }

    this.map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 11,
      ...viewOptions,
    });
  }

  private invalidateMapSize(): void {
    const el = this.mapContainer?.nativeElement;
    if (!this.map || !el || el.offsetWidth < 50 || el.offsetHeight < 50) return;
    this.map.invalidateSize();
    this.siteLayersGroup?.bringToFront();
  }

  private entitiesKey(ids: number[]): string {
    return ids.slice().sort((a, b) => a - b).join(',');
  }

  ngAfterViewInit(): void {
    const waitForContainer = () => {
      const el = this.mapContainer?.nativeElement;
      const hasSize = el?.offsetHeight > 0 && el?.offsetWidth > 0;

      if (hasSize) {
        this.initMap();
        if (this.changePosition()) {
          this.syncSiteEditGeometry();
        }
        this.observeContainerResize(el);
        setTimeout(() => this.invalidateMapSize(), 0);
      } else {
        setTimeout(waitForContainer, 100);
      }
    };

    waitForContainer();
  }

  private observeContainerResize(el: HTMLElement): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeDebounceId) {
        clearTimeout(this.resizeDebounceId);
      }
      this.resizeDebounceId = setTimeout(() => this.invalidateMapSize(), 150);
    });
    this.resizeObserver.observe(el);
  }

  private initMap(): void {
    if (this.map) return;

    const mapContainer = this.mapContainer.nativeElement;
    this.map = L.map(mapContainer, {
      center: [46.8, 2.5],
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    const markerClusterGroup =
      typeof (L as any).markerClusterGroup === 'function'
        ? (L as any).markerClusterGroup()
        : (L.featureGroup() as L.MarkerClusterGroup);
    this.markerClusterGroup = markerClusterGroup;
    markerClusterGroup.addTo(this.map);

    const siteLayersGroup = L.featureGroup();
    this.siteLayersGroup = siteLayersGroup;
    siteLayersGroup.addTo(this.map);

    this.mapReady.set(true);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private buildSitePopup(site: Site): string {
    const departements = (site.departements ?? []).map(dep => dep.nom_dep).join(', ');
    const uniqueRegions = new Map<string, string>();
    for (const dep of site.departements ?? []) {
      const region = dep.region;
      if (!region?.nom_reg?.trim()) continue;
      const key = region.insee_reg || region.nom_reg;
      uniqueRegions.set(key, region.nom_reg);
    }
    const regions = [...uniqueRegions.values()].join(', ');

    let actionsHtml = '';
    if (this.siteDiagnosticActions()) {
      const diagnostics = [...(site.diagnostics ?? [])].sort((a, b) => {
        const yearA = Diagnostic.displayAnnee(a);
        const yearB = Diagnostic.displayAnnee(b);
        return Number(yearB) - Number(yearA);
      });

      const yearButtons = diagnostics
        .map(diag => {
          const year = this.escapeHtml(Diagnostic.displayAnnee(diag));
          return `<button type="button" class="map-popup-btn map-popup-btn-year" data-diag-id="${diag.id_diagnostic}" data-diag-slug="${this.escapeHtml(diag.slug)}">${year}</button>`;
        })
        .join('');

      const isOwner = this.currentUserId() > 0 && site.created_by === this.currentUserId();
      const editButton = isOwner
        ? `<button type="button" class="map-popup-btn map-popup-btn-edit" data-site-id="${site.id_site}" title="Modifier le site" aria-label="Modifier le site">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>`
        : '';

      actionsHtml = `
        <div class="map-popup-actions">
          ${yearButtons}
          ${editButton}
          <button type="button" class="map-popup-btn map-popup-btn-create" data-site-id="${site.id_site}" title="Nouveau diagnostic">+</button>
        </div>
      `;
    }

    return `
      <div class="map-site-popup">
        <strong>${this.escapeHtml(site.nom)}</strong><br>
        Statut : ${this.escapeHtml(site.type?.libelle ?? '')}<br>
        Régions : ${this.escapeHtml(regions)}<br>
        Départements : ${this.escapeHtml(departements)}<br>
        ${actionsHtml}
      </div>
    `;
  }

  private bindSitePopupActions(layer: L.Layer, site: Site): void {
    if (!this.siteDiagnosticActions()) return;

    const onPopupOpen = () => {
      const popupEl = (layer as L.Marker).getPopup?.()?.getElement()
        ?? (layer as L.GeoJSON).getPopup?.()?.getElement();
      if (!popupEl) return;

      popupEl.querySelectorAll<HTMLButtonElement>('.map-popup-btn-year').forEach(btn => {
        btn.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          const id = Number(btn.dataset['diagId']);
          const slug = btn.dataset['diagSlug'];
          if (!id || !slug) return;
          this.openDiagnostic.emit({ id, slug, site });
        };
      });

      const editBtn = popupEl.querySelector<HTMLButtonElement>('.map-popup-btn-edit');
      if (editBtn) {
        editBtn.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.editSite.emit(site);
        };
      }

      const createBtn = popupEl.querySelector<HTMLButtonElement>('.map-popup-btn-create');
      if (createBtn) {
        createBtn.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.createDiagnostic.emit(site);
        };
      }
    };

    if ((layer as L.Marker).bindPopup) {
      (layer as L.Marker).on('popupopen', onPopupOpen);
      return;
    }

    layer.on('popupopen', onPopupOpen);
  }

  private renderSiteMarkers(): void {
    if (!this.map || !this.markerClusterGroup || !this.siteLayersGroup) return;

    const bounds = L.latLngBounds([]);
    let featureCount = 0;
    let singleCoords: { lat: number; lng: number } | undefined;

    this.markerClusterGroup.clearLayers();
    this.siteLayersGroup.clearLayers();

    for (const site of this.sites()) {
      const popup = this.buildSitePopup(site);
      const polygon = getSitePolygonGeometry(site);
      const coords = getSitePointCoordinates(site);

      if (polygon) {
        const layer = L.geoJSON(polygon as GeoJSON.GeoJsonObject, {
          style: {
            color: '#2e7d32',
            weight: 2,
            fillColor: '#4caf50',
            fillOpacity: 0.25,
          },
          onEachFeature: (_feature, geoLayer) => {
            geoLayer.bindPopup(popup);
            this.bindSitePopupActions(geoLayer, site);
          },
        });
        this.siteLayersGroup.addLayer(layer);
        bounds.extend(layer.getBounds());
        featureCount++;
        const center = layer.getBounds().getCenter();
        singleCoords = coords ?? { lat: center.lat, lng: center.lng };
      }

      if (coords) {
        this.addSitePointLayer(site, popup, coords, bounds, !!polygon, true);
        if (!polygon) {
          featureCount++;
          singleCoords = coords;
        }
      }
    }

    this.siteLayersGroup.bringToFront();

    const sitesKey = this.entitiesKey(this.sites().map(site => site.id_site));
    if (sitesKey !== this.lastFittedSitesKey) {
      this.fitMapToBounds(bounds, featureCount, singleCoords);
      this.lastFittedSitesKey = sitesKey;
    }
  }

  private renderActorMarkers(): void {
    if (!this.map || !this.markerClusterGroup) return;

    const bounds = L.latLngBounds([]);
    let markerCount = 0;
    let singleCoords: { lat: number; lng: number } | undefined;

    this.markerClusterGroup.clearLayers();

    for (const actor of this.actors()) {
      if (!actor.commune?.latitude || !actor.commune?.longitude) continue;

      const lat = parseFloat(actor.commune.latitude);
      const lng = parseFloat(actor.commune.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const marker = L.marker([lat, lng]);
      const categories = actor.categories?.map(c => c.libelle).join(', ') ?? '';

      marker.bindPopup(`
        <strong>${actor.nom} ${actor.prenom}</strong><br>
        ${this.labels.statusLabel} : ${actor.fonction}<br>
        ${this.labels.category} : ${categories}<br>
        ${this.labels.telephone} : ${actor.telephone}<br>
        ${this.labels.mail} : ${actor.mail}<br>
        ${this.labels.town} : ${actor.commune.nom_com}<br>
        ${this.labels.profile} : ${actor.profil?.libelle}<br>
        ${this.labels.structure} : ${actor.structure}<br>
      `);

      this.markerClusterGroup.addLayer(marker);
      bounds.extend([lat, lng]);
      markerCount++;
      singleCoords = { lat, lng };
    }

    const actorsKey = this.entitiesKey(this.actors().map(actor => actor.id_acteur));
    if (actorsKey !== this.lastFittedActorsKey) {
      this.fitMapToBounds(bounds, markerCount, singleCoords);
      this.lastFittedActorsKey = actorsKey;
    }
  }

  activatePointMode(): void {
    this.lastSyncedEditGeomKey = '';
    this.siteDrawMode.set('point');
    this.clearEditGeometryLayer();
    this.formGroup()?.patchValue({ geom: null });
    this.setupPointPlacement();
  }

  triggerGeoJsonImport(): void {
    this.geoJsonInput?.nativeElement.click();
  }

  onGeoJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const geom = parseGeoJsonFileContent(parsed);
        if (!geom) {
          this.toaster.error('Le fichier doit contenir un polygone GeoJSON (Polygon ou MultiPolygon).');
          return;
        }
        this.applyPolygonGeometry(geom);
      } catch {
        this.toaster.error('Fichier GeoJSON invalide.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  private applyPolygonGeometry(geom: GeoJsonSiteGeom): void {
    if (!this.map || !this.formGroup()) return;

    const centroid = computeGeometryCentroid(geom);
    if (!centroid) {
      this.toaster.error('Impossible de calculer le centroïde du polygone.');
      return;
    }

    const geomPt: GeoJsonPoint = {
      type: 'Point',
      coordinates: [centroid.lng, centroid.lat],
    };

    this.lastSyncedEditGeomKey = this.editGeometryKey(geom, geomPt);
    this.showPolygonEditGeometry(geom, geomPt, true);

    this.formGroup()!.patchValue({
      geom,
      geom_pt: geomPt,
      position_x: centroid.lng.toFixed(6),
      position_y: centroid.lat.toFixed(6),
    });
  }

  private showPolygonEditGeometry(
    geom: GeoJsonSiteGeom,
    geomPt: GeoJsonPoint | null,
    fitBounds: boolean
  ): void {
    if (!this.map) return;

    const centroid = geomPt
      ? { lng: geomPt.coordinates[0], lat: geomPt.coordinates[1] }
      : computeGeometryCentroid(geom);
    this.siteDrawMode.set('polygon');
    this.disablePointPlacement();
    this.clearEditGeometryLayer();

    this.editGeometryLayer = L.geoJSON(geom as GeoJSON.GeoJsonObject, {
      style: {
        color: '#2e7d32',
        weight: 2,
        fillColor: '#4caf50',
        fillOpacity: 0.25,
      },
    });
    this.editGeometryLayer.addTo(this.map);

    if (centroid) {
      this.marker?.remove();
      this.marker = L.marker([centroid.lat, centroid.lng], { draggable: false }).addTo(this.map);
    }

    if (fitBounds && this.editGeometryLayer.getBounds().isValid()) {
      this.map.fitBounds(this.editGeometryLayer.getBounds(), { padding: [30, 30], maxZoom: 14 });
    } else if (centroid) {
      this.map.setView([centroid.lat, centroid.lng], 10, { animate: false });
    }
  }

  private clearEditGeometryLayer(): void {
    this.editGeometryLayer?.remove();
    this.editGeometryLayer = undefined;
  }

  private disablePointPlacement(): void {
    if (this.map && this.mapClickListener) {
      this.map.off('click', this.mapClickListener);
    }
  }

  private setupPointPlacement(): void {
    if (!this.changePosition() || !this.formGroup() || !this.map) return;

    const lat = +this.formGroup()!.get('position_y')?.value || 47.316667;
    const lng = +this.formGroup()!.get('position_x')?.value || 5.016667;

    this.marker?.remove();
    this.marker = L.marker([lat, lng], { draggable: false }).addTo(this.map);
    this.disablePointPlacement();

    this.mapClickListener = (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      this.marker!.setLatLng([clickLat, clickLng]);
      this.formGroup()!.patchValue({
        position_y: clickLat.toFixed(6),
        position_x: clickLng.toFixed(6),
        geom: null,
        geom_pt: { type: 'Point', coordinates: [clickLng, clickLat] },
      });
    };

    this.map.on('click', this.mapClickListener);
    this.map.setView([lat, lng], 13);
  }

  moveMarker(): void {
    if (!this.changePosition() || !this.formGroup() || !this.map) return;
    if (this.siteDrawMode() !== 'point') return;
    this.setupPointPlacement();
  }

  ngOnDestroy(): void {
    this.formGroupSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    if (this.resizeDebounceId) {
      clearTimeout(this.resizeDebounceId);
    }
    this.mapReady.set(false);

    if (this.map && this.mapClickListener) {
      this.map.off('click', this.mapClickListener);
    }

    this.marker?.remove();
    this.clearEditGeometryLayer();
    this.markerClusterGroup?.clearLayers();
    this.siteLayersGroup?.clearLayers();
    this.map?.off();
    this.map?.remove();
    this.map = undefined;
  }

  exportMapAsPNG(): void {
    const mapElement = this.mapContainer?.nativeElement;
    if (!mapElement) return;

    const zoomControls = mapElement.querySelector('.leaflet-control-zoom') as HTMLElement | null;
    if (zoomControls) {
      zoomControls.style.display = 'none';
    }
    mapElement.style.cursor = 'progress';

    html2canvas(mapElement, { useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (zoomControls) {
        zoomControls.style.display = 'block';
        mapElement.style.cursor = 'default';
      }
    });
  }
}
