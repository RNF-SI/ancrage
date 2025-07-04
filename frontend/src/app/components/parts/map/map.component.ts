import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  input,
  effect,
  signal
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
import { toSignal } from '@angular/core/rxjs-interop';

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
export class MapComponent implements AfterViewInit,OnDestroy {
  private map: L.Map | undefined;
  readonly sites = input<Site[]>([]);
  readonly changePosition = input<boolean>(false);
  readonly formGroup = input<FormGroup>(new FormGroup({}));
  readonly mapId = input<string>('map');
  readonly formGroupValues = toSignal(
    this.formGroup().valueChanges,
    { initialValue: this.formGroup()!.value }
  );
  readonly actors = input<Acteur[]>([]);
  private readonly mapSig = signal<L.Map | null>(null);
  private markerClusterGroup: L.MarkerClusterGroup | undefined;
  marker: L.Marker | undefined;
  private mapClickListener: any;
  labels = new Labels();
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  constructor(){
    effect(() => {
      if (this.mapSig() && !this.changePosition() && this.sites().length > 0 ) {
        this.addMarkers();
      }
    });

    effect(() => {
      const values = this.formGroupValues();
      const lat = +values?.position_y;
      const lng = +values?.position_x;
    
      if (this.mapSig() && lat && lng) {
        this.moveMarker();  // déclenché quand formGroup change de position
      }
    });

    effect(() => {
      const map = this.mapSig();
      const actors = this.actors();
   
      if (map && actors.length > 0 && !this.changePosition()) {
        this.addMarkersActors();
      }
    });
  }


  ngAfterViewInit(): void {
    const waitForContainer = () => {
      const el = this.mapContainer?.nativeElement;
      const hasSize = el?.offsetHeight > 0 && el?.offsetWidth > 0;

      if (hasSize) {
        this.initMap();
        if (this.changePosition()) {
          this.moveMarker();
        }
        setTimeout(() => this.mapSig()?.invalidateSize(), 100);
      } else {
        setTimeout(waitForContainer, 100);
      }
    };

    waitForContainer();
  }

  private initMap(): void {
    const mapContainer = this.mapContainer.nativeElement;
    this.map = L.map(mapContainer, {
      center: [48.8566, 2.3522],
      zoom: 13
    });
    this.mapSig.set(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Vérification que markerClusterGroup est disponible
    if (typeof (L as any).markerClusterGroup === 'function') {
      this.markerClusterGroup = (L as any).markerClusterGroup();
      this.markerClusterGroup?.addTo(this.map);
    } else {
  
      this.markerClusterGroup = L.featureGroup() as any;
      this.markerClusterGroup?.addTo(this.map);
    }

    if (this.formGroup) {
      this.formGroup()!.valueChanges.subscribe(values => {
        const latitude = +values.position_y;
        const longitude = +values.position_x;
        if (latitude && longitude && this.changePosition()) {
          this.moveMarker();
        }
      });
    }
  }

  addMarkers(): void {
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup?.clearLayers();

    for (const site of this.sites()) {
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

    if (this.sites().length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.sites().length === 1) {
      const lat = parseFloat(this.sites()[0].position_y);
      const lng = parseFloat(this.sites()[0].position_x);
      this.map!.setView([lat, lng], 13);
    }
  }

  addMarkersActors(): void {
    console.log('ok');
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup?.clearLayers();

    for (const actor of this.actors()) {
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

    if (this.actors().length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.actors().length === 1) {
      const lat = parseFloat(this.actors()[0].commune.latitude!);
      const lng = parseFloat(this.actors()[0].commune.longitude!);
      this.map!.setView([lat, lng], 13);
    }
  }

  moveMarker(): void {
    if (!this.changePosition() || !this.formGroup() || !this.map) return;

    let lat = +this.formGroup()!.get('position_y')?.value || 47.316667;
    let lng = +this.formGroup()!.get('position_x')?.value || 5.016667;

    this.marker?.remove();
    this.marker = L.marker([lat, lng], { draggable: false }).addTo(this.map);

    this.mapClickListener = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker!.setLatLng([lat, lng]);
      this.formGroup()!.patchValue({
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
    const mapContainer = document.getElementById('map');
    if (mapContainer) mapContainer.innerHTML = '';
  }

  exportMapAsPNG(): void {
    const mapElement = document.getElementById('map');
  
    if (mapElement) {
      // Sélectionne les contrôles de zoom (classe par défaut de Leaflet)
      const zoomControls = mapElement.querySelector('.leaflet-control-zoom') as HTMLElement;
  
      if (zoomControls) {
        zoomControls.style.display = 'none'; // Masquer les contrôles
      }
  
      // Petite pause pour s'assurer que le DOM est à jour (facultatif mais plus sûr)
      setTimeout(() => {
        html2canvas(mapElement, { useCORS: true }).then(canvas => {
          const link = document.createElement('a');
          link.download = 'map.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
  
          // Réaffiche les contrôles après la capture
          if (zoomControls) {
            zoomControls.style.display = 'block';
          }
        });
      }, 100); // 100ms suffisent généralement
    }
  }
}