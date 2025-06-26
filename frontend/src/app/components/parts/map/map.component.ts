import {
  Component,
  AfterViewInit,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Acteur } from '@app/models/acteur.model';
import { Site } from '@app/models/site.model';
import { Labels } from '@app/utils/labels';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@bluehalo/ngx-leaflet-markercluster';
import html2canvas from 'html2canvas';
import { MatButtonModule } from '@angular/material/button';
import * as L from 'leaflet'; 

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: 'assets/data/marker-icon-2x.png',
  iconUrl: 'assets/data/marker-icon.png',
  shadowUrl: 'assets/data/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: true,
  imports: [MatButtonModule, LeafletModule, LeafletMarkerClusterModule]
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy, AfterViewChecked {
  private map: L.Map | undefined;
  @Input() sites: Site[] = [];
  @Input() changePosition = false;
  @Input() formGroup: FormGroup | undefined;
  @Input() mapId = 'map';
  private markerClusterGroup: L.MarkerClusterGroup | undefined;
  marker: L.Marker | undefined;
  private mapClickListener: any;
  labels = new Labels();
  private actorsRendered = false;
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private _actors: Acteur[] = [];

  @Input()
  set actors(value: Acteur[]) {
    this._actors = value;
    if (this.map && !this.changePosition) {
      this.addMarkersActors();
    }
  }

  get actors(): Acteur[] {
    return this._actors;
  }

  ngAfterViewInit(): void {
    const waitForContainer = () => {
      const el = this.mapContainer?.nativeElement;
      const hasSize = el?.offsetHeight > 0 && el?.offsetWidth > 0;

      if (hasSize) {
        this.initMap();
        if (this.changePosition) {
          this.moveMarker();
        }
        setTimeout(() => this.map?.invalidateSize(), 100);
      } else {
        setTimeout(waitForContainer, 100);
      }
    };

    waitForContainer();
  }

  ngAfterViewChecked(): void {
    if (this.map && this.actors.length > 0 && !this.changePosition && !this.actorsRendered) {
      this.addMarkersActors();
      this.actorsRendered = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sites'] && this.map && !this.changePosition) {
      this.addMarkers();
    }

    if (changes['formGroup'] && this.map) {
      const latitude = +this.formGroup?.get('position_y')?.value;
      const longitude = +this.formGroup?.get('position_x')?.value;
      if (latitude && longitude) {
        this.moveMarker();
      }
    }
  }

  private initMap(): void {
    const mapContainer = this.mapContainer.nativeElement;
    this.map = L.map(mapContainer, {
      center: [48.8566, 2.3522],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Vérification que markerClusterGroup est disponible
    if (typeof (L as any).markerClusterGroup === 'function') {
      this.markerClusterGroup = (L as any).markerClusterGroup();
      this.markerClusterGroup?.addTo(this.map);
    } else {
      console.error('MarkerClusterGroup not loaded properly');
      // Fallback: utiliser un simple FeatureGroup
      this.markerClusterGroup = L.featureGroup() as any;
      this.markerClusterGroup?.addTo(this.map);
    }

    if (this.formGroup) {
      this.formGroup.valueChanges.subscribe(values => {
        const latitude = +values.position_y;
        const longitude = +values.position_x;
        if (latitude && longitude && this.changePosition) {
          this.moveMarker();
        }
      });
    }
  }

  addMarkers(): void {
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup?.clearLayers();

    for (const site of this.sites) {
      const lat = parseFloat(site.position_y);
      const lng = parseFloat(site.position_x);
      const marker = L.marker([lat, lng]);

      const departements = site.departements.map(dep => dep.nom_dep).join(' ');
      const regions = site.departements.map(dep => dep.region.nom_reg).join(' ');

      marker.bindPopup(`
        <strong>${site.nom}</strong><br>
        Statut : ${site.type.libelle}<br>
        Régions : ${regions}<br>
        Départements : ${departements}<br>
      `);

      marker.addTo(this.markerClusterGroup!);
      bounds.extend([lat, lng]);
    }

    if (this.sites.length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.sites.length === 1) {
      const lat = parseFloat(this.sites[0].position_y);
      const lng = parseFloat(this.sites[0].position_x);
      this.map!.setView([lat, lng], 13);
    }
  }

  addMarkersActors(): void {
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup?.clearLayers();

    for (const actor of this.actors) {
      const lat = parseFloat(actor.commune.latitude!);
      const lng = parseFloat(actor.commune.longitude!);
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

      marker.addTo(this.markerClusterGroup!);
      bounds.extend([lat, lng]);
    }

    if (this.actors.length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.actors.length === 1) {
      const lat = parseFloat(this.actors[0].commune.latitude!);
      const lng = parseFloat(this.actors[0].commune.longitude!);
      this.map!.setView([lat, lng], 13);
    }
  }

  moveMarker(): void {
    if (!this.changePosition || !this.formGroup || !this.map) return;

    this.sites = [];

    let lat = +this.formGroup.get('position_y')?.value || 47.316667;
    let lng = +this.formGroup.get('position_x')?.value || 5.016667;

    this.marker?.remove();
    this.marker = L.marker([lat, lng], { draggable: false }).addTo(this.map);

    this.mapClickListener = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker!.setLatLng([lat, lng]);
      this.formGroup?.patchValue({
        position_y: lat.toFixed(6),
        position_x: lng.toFixed(6)
      });
    };

    this.map.on('click', this.mapClickListener);
    this.map.setView([lat, lng], 13);
  }

  ngOnDestroy(): void {
    this.map?.off();
    this.map?.remove();
    this.markerClusterGroup?.clearLayers();
    this.actorsRendered = false;
    const mapContainer = document.getElementById('map');
    if (mapContainer) mapContainer.innerHTML = '';
  }

  exportMapAsPNG(): void {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      html2canvas(mapElement, { useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  }
}