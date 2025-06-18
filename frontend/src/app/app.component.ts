import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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
    imports:[RouterModule]
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
