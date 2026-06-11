import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { filter } from 'rxjs';


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
    imports:[
      RouterModule,
      FontAwesomeModule,
    ],
    standalone:true
})
export class AppComponent implements OnInit{
  title = 'RNF - Diagnostic d\'Ancrage Territorial';

  loading = true;
  routerSubscription: any;
  private router = inject(Router);

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fab, fas, far);
  }

  ngOnInit(): void {
    this.recallJsFuntions();
    this.loading = false;
    
  }


  recallJsFuntions() {
    this.loading = true;
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.loadScript();
        
        this.loading = false
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  public loadScript() {
    
    for (let i = 0; i < dynamicScripts.length; i++) {
      const node = document.createElement("script");
      node.src = dynamicScripts[i];
      node.type = "text/javascript";
      node.async = false;
      node.charset = "utf-8";
      document.getElementsByTagName("head")[0].appendChild(node);
    }
    
  }


  isScriptLoaded = (target: string): boolean => {
    return document.querySelector('script[src="' + target + '"]') ? true : false
  }

  // Signed In status


}
