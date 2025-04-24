import { Component, AfterViewInit, Input, SimpleChanges, inject} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  @Input() changePosition:boolean = false;
  @Input() formGroup:FormGroup | undefined;
  markerClusterGroup: L.MarkerClusterGroup= L.markerClusterGroup();
  markerClusterData = [];
  mapPoint: any;
  marker:any;
  private route:ActivatedRoute = inject(ActivatedRoute);
 
 
  ngAfterViewInit(): void {
    this.initMap();
    if (this.changePosition){
      this.moveMarker();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sites'] && this.map && !this.changePosition) {
      this.addMarkers(); // Ajoute les marqueurs dès que sites est dispo
    }
    if (changes['formGroup'] && this.map) {
      // 🔥 Vérifie si les positions sont prêtes avant de bouger le marqueur
      let latitude = +this.formGroup?.get('position_y')?.value;
      let longitude = +this.formGroup?.get('position_x')?.value;
      
      console.log(latitude);
      this.moveMarker();
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
      const marker = L.marker([lat,lng]).addTo(this.markerClusterGroup);
      var habitats:string ="";
      for (let j=0;j<this.sites[i].habitats.length;j++){
       
        habitats += this.sites[i].habitats[j].libelle + " ";
      }
      var departements:string ="";
      for (let k=0;k<this.sites[i].departements.length;k++){
       
        departements += this.sites[i].departements[k].nom_dep + " ";
      }
      marker.bindPopup(`
        <strong>${this.sites[i].nom}</strong><br>
        Départements : ${departements}<br>
        Statut : ${this.sites[i].type.libelle}<br>
        Habitats : ${habitats}<br>
      `);
      bounds.extend([lat, lng]);
      this.markerClusterGroup.addTo(this.map!);
      
    }

    if (this.sites.length > 0) {
      this.map!.fitBounds(bounds, { padding: [30, 30] }); 
    }
  }

  moveMarker(){
    if (this.changePosition){
      const bounds = L.latLngBounds([]);
      this.sites=[];
      let latitude:number=+this.formGroup?.get('position_y')?.value;
      let longitude:number=+this.formGroup?.get('position_x')?.value;;
      if(longitude==0 || latitude ==0){
        latitude = 47.316667;
        longitude = 5.016667;

      }
      if (this.marker) {
        this.marker.remove();
      }
  
      this.marker = L.marker([latitude, longitude], { draggable: false }).addTo(this.map!);
 
      this.map!.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        this.marker.setLatLng([lat, lng]);

        this.formGroup?.patchValue({
          position_y: lat.toFixed(6),  
          position_x: lng.toFixed(6)   
        });
      });
      bounds.extend([latitude, longitude]);
      this.map!.fitBounds(bounds, { padding: [30, 30] });
    }
  }
  
}
