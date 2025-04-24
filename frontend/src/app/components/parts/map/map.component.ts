import { Component, AfterViewInit, Input, SimpleChanges} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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
  constructor(private router: Router) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;  // 🔥 Force le reload du composant
  }
  private map: L.Map | undefined;
  @Input() sites: Site[] = [];
  @Input() changePosition:boolean = false;
  @Input() formGroup:FormGroup | undefined;
  markerClusterGroup: L.MarkerClusterGroup= L.markerClusterGroup();
  markerClusterData = [];
  mapPoint: any;
  marker:any;
 /*  constructor(private markerService: MarkerService) { } */
  ngAfterViewInit(): void {
    this.initMap();
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sites'] && this.map) {
      this.addMarkers(); // Ajoute les marqueurs dès que sites est dispo
    }
    if (changes['formGroup'] && this.map) {
      // 🔥 Vérifie si les positions sont prêtes avant de bouger le marqueur
      const latitude = +this.formGroup?.get('position_y')?.value;
      const longitude = +this.formGroup?.get('position_x')?.value;
      console.log(latitude);
      if (latitude && longitude) {
        this.moveMarker();
      }
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
    if (this.formGroup) {
      // 🔥 Écoute les changements de valeurs du formGroup
      this.formGroup.valueChanges.subscribe(values => {
        const latitude = +values.position_y;
        const longitude = +values.position_x;
        
        if (latitude && longitude && this.changePosition) {
          this.moveMarker();
        }
      });
    }
    
   
    
  }
  addMarkers(){
    const bounds = L.latLngBounds([]);
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    } else {
      this.markerClusterGroup = L.markerClusterGroup();
      
    }
    
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

  moveMarker(){
    if (this.changePosition){
      const bounds = L.latLngBounds([]);
      this.sites=[];
      const latitude: number = +this.formGroup?.get('position_y')?.value;
      const longitude: number = +this.formGroup?.get('position_x')?.value;
      if (this.marker) {
        this.marker.remove();
      }
         // Initialiser un marqueur à une position par défaut
      this.marker = L.marker([latitude, longitude], { draggable: false }).addTo(this.map!);
      console.log(this.marker);
      // 🔥 Écouteur de clic sur la carte
      this.map!.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // 🔥 Déplacer le marqueur à la nouvelle position
        this.marker.setLatLng([lat, lng]);

        // 🔥 Récupérer les coordonnées
        console.log('Nouveau point :', lat, lng);

        // Si tu veux mettre à jour les champs dans le formulaire Angular :
        this.formGroup?.patchValue({
          position_y: lat.toFixed(6),  // Latitude
          position_x: lng.toFixed(6)   // Longitude
        });
      });
      bounds.extend([latitude, longitude]);
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    }
  }
  
}
