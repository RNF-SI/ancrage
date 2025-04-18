import { Component, AfterViewInit, Input, SimpleChanges} from '@angular/core';
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
export class MapComponent implements AfterViewInit {
  private map: L.Map | undefined;
  @Input() sites: Site[] = [];
  markerClusterGroup: L.MarkerClusterGroup= L.markerClusterGroup();
  markerClusterData = [];
  mapPoint: any;
 /*  constructor(private markerService: MarkerService) { } */
  ngAfterViewInit(): void {
    this.initMap();

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sites'] && this.map) {
      this.addMarkers(); // Ajoute les marqueurs dès que sites est dispo
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [48.8566, 2.3522], // Coordonnées de Paris par défaut
      zoom: 13
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    
  }
  addMarkers(){
    const bounds = L.latLngBounds([]);
    this.markerClusterGroup = L.markerClusterGroup();
    for(let i=0;i<this.sites.length;i++){
      const lat = parseFloat(this.sites[i].position_y);
      const lng = parseFloat(this.sites[i].position_x);
      L.marker([lat,lng]).addTo(this.markerClusterGroup);
      bounds.extend([lat, lng]);
      this.markerClusterGroup.addTo(this.map!);
      
    }

    if (this.sites.length > 0) {
      this.map!.fitBounds(bounds, { padding: [30, 30] }); // ← zoom auto sur tous les points
    }
  }
  
}
