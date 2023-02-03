import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { filter } from 'rxjs';


const dynamicScripts = [
  'assets/js/webflow.js',
  'assets/js/modal.js',
  'assets/js/videoClick.js',
  'assets/js/jquery-3.5.1.min.js',
  ];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'auth-ancrage';

  loading = true;
  routerSubscription: any;
  

  constructor(
    private router: Router,
    public _authService: AuthService,
    ) {

    }

  ngOnInit(): void {
    this.recallJsFuntions();
    this.loading = false
  }


  recallJsFuntions() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.loadScript();
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  public loadScript() {
    console.log("preparing to load…")
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
  public get signedIn(): boolean {
    return this._authService.authenticated || false;
  }

}
