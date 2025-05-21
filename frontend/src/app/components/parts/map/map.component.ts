import {
  Component,
  AfterViewInit,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Site } from '@app/models/site.model';
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
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {

  private map: L.Map | undefined;
  @Input() sites: Site[] = [];
  @Input() changePosition: boolean = false;
  @Input() formGroup: FormGroup | undefined;
  @Input() mapId = 'map';
  markerClusterGroup: L.MarkerClusterGroup = L.markerClusterGroup();
  marker: any;
  private mapClickListener: any;
 
  
  ngAfterViewInit(): void {
    setTimeout(() => {this.initMap();
    if (this.changePosition) {
      this.moveMarker();
    }}, 100);
    
    
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
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      console.log('Map container found');
      
    }

    // Vérifie si la carte est déjà initialisée (Leaflet lève une erreur sinon)
    if ((mapContainer as any)._leaflet_id) {
      // Leaflet croit que la carte est encore initialisée => on reset
      (mapContainer as any)._leaflet_id = null;
    }

    this.map = L.map(this.mapId, {
      center: [48.8566, 2.3522],
      zoom: 13
    });
    console.log(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.map.invalidateSize();
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

    const mapContainer = document.getElementById('map');
    console.log(mapContainer);
    if (mapContainer) {
      mapContainer.innerHTML = ''; // supprime tout contenu DOM résiduel
    }
    
  }
}