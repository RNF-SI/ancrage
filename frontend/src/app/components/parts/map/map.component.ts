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
import * as L from 'leaflet';
import 'leaflet.markercluster';

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
  standalone: true,
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy,AfterViewChecked {

  private map: L.Map | undefined;
  @Input() sites: Site[] = [];
  @Input() changePosition: boolean = false;
  @Input() formGroup: FormGroup | undefined;
  @Input() mapId = 'map';
  markerClusterGroup: L.MarkerClusterGroup = L.markerClusterGroup();
  marker: any;
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
  
        setTimeout(() => {
          this.map?.invalidateSize();
        }, 100);
      } else {
        // Re-tente dans 100ms jusqu'à ce que le conteneur soit visible
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
    const mapContainer = this.mapContainer?.nativeElement;
    if (mapContainer) {
      console.log('Map container found');
      
    }

    this.map = L.map(mapContainer, {
      center: [48.8566, 2.3522],
      zoom: 13
    });
    console.log(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    /* setTimeout(() => {
      this.map?.invalidateSize();
    }, 200); */
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

  addMarkers() {
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup.clearLayers();

    for (let i = 0; i < this.sites.length; i++) {
      const lat = parseFloat(this.sites[i].position_y);
      const lng = parseFloat(this.sites[i].position_x);
      const marker = L.marker([lat, lng]).addTo(this.markerClusterGroup);

      let departements = '';
      let regions = '';
      for (let k = 0; k < this.sites[i].departements.length; k++) {
        departements += this.sites[i].departements[k].nom_dep + " ";
        regions += this.sites[i].departements[k].region.nom_reg;
      }

      marker.bindPopup(`
        <strong>${this.sites[i].nom}</strong><br>
        Statut : ${this.sites[i].type.libelle}<br>
        Régions : ${regions}<br>
        Départements : ${departements}<br>
      `);

      bounds.extend([lat, lng]);
    }

    this.markerClusterGroup.addTo(this.map!);

    if (this.sites.length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.sites.length === 1) {
      const lat = parseFloat(this.sites[0].position_y);
      const lng = parseFloat(this.sites[0].position_x);
      this.map!.setView([lat, lng], 13);
    }
  }

  addMarkersActors() {
    console.log(this.actors);
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup.clearLayers();
    
    for (let i = 0; i < this.actors.length; i++) {
      const lat = parseFloat(this.actors[i].commune.latitude!);
      const lng = parseFloat(this.actors[i].commune.longitude!);
      const marker = L.marker([lat, lng]).addTo(this.markerClusterGroup);

      let categories = this.actors[i].categories?.map(c => c.libelle).join(", ") ?? "";

      marker.bindPopup(`
        <strong>${this.actors[i].nom + ' '+ this.actors[i].prenom}</strong><br>
        ${this.labels.statusLabel} : ${this.actors[i].fonction}<br>
        ${this.labels.category} : ${categories}<br>
        ${this.labels.telephone} : ${this.actors[i].telephone}<br>
        ${this.labels.mail} : ${this.actors[i].mail}<br>
        ${this.labels.town} : ${this.actors[i].commune.nom_com}<br>
        ${this.labels.profile} : ${this.actors[i].profil?.libelle}<br>
        ${this.labels.structure} : ${this.actors[i].structure}<br>
      `);

      bounds.extend([lat, lng]);
    }

    this.markerClusterGroup.addTo(this.map!);

    if (this.actors.length > 1) {
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    } else if (this.actors.length === 1) {
      const lat = parseFloat(this.actors[0].commune.latitude!);
      const lng = parseFloat(this.actors[0].commune.longitude!);
      this.map!.setView([lat, lng], 13);
    }
  }

  moveMarker() {
    if (this.changePosition) {
      
      this.sites = [];

      let latitude: number = +this.formGroup?.get('position_y')?.value;
      let longitude: number = +this.formGroup?.get('position_x')?.value;

      if (longitude === 0 || latitude === 0) {
        latitude = 47.316667;
        longitude = 5.016667;
      }

      if (this.marker) {
        this.marker.remove();
      }

      this.marker = L.marker([latitude, longitude], { draggable: false }).addTo(this.map!);

      this.mapClickListener = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        this.marker.setLatLng([lat, lng]);
        this.formGroup?.patchValue({
          position_y: lat.toFixed(6),
          position_x: lng.toFixed(6)
        });
      };

      this.map!.on('click', this.mapClickListener);

      this.map!.setView([latitude, longitude], 13);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off(); // retire tous les écouteurs
      this.map.remove(); // détruit la carte Leaflet
      this.map = undefined;
    }
    this.markerClusterGroup.clearLayers();
    this.actorsRendered = false;
    const mapContainer = document.getElementById('map');
    console.log(mapContainer);
    if (mapContainer) {
      mapContainer.innerHTML = ''; // supprime tout contenu DOM résiduel
    }
    
  }
}