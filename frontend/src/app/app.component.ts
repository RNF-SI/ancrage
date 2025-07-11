import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter } from 'rxjs';
import { HomeRnfModule } from './home-rnf/home-rnf.module';


const dynamicScripts = [
  'assets/js/typekit-owy4cfp.js',
  'assets/js/jquery-3.5.1.min.js',
  'assets/infographies/info-1/js/webflow.js',
  'assets/infographies/info-2/js/webflow.js',
  'assets/infographies/info-3/js/webflow.js',
  'assets/js/webflow.js',
  'assets/js/videoClick.js',
  'assets/js/modal.js',
  ];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports:[RouterModule,FontAwesomeModule,HomeRnfModule],
    standalone:true
})
export class AppComponent implements OnInit{
  title = 'RNF - Diagnostic d\'Ancrage Territorial';

  loading = true;
  routerSubscription: any;

  constructor(
    private router: Router,
   
    ) {

    }


  ngOnInit(): void {
   
    
  }

}