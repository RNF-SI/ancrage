import { Component } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-choix-site',
  templateUrl: './choix-site.component.html',
  styleUrls: ['./choix-site.component.css'],
  standalone:true,
  imports:[MapComponent,CommonModule]
})
export class ChoixSiteComponent {
sites: any;

}
