import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, ParamMap } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

/** ActionLink optional data */
export interface ActionData { 
  // Optional parameters
  [key: string]: any;
};

/** Actinng as a CanActivate guard to intercept routing actions */
@Injectable({ providedIn: 'root' })
export class ActionLinkObserver implements CanActivate {

  /** Streams the canActivate requests */
  readonly observers$ = new ReplaySubject<{
    route : ActivatedRouteSnapshot;
    state : RouterStateSnapshot;
  }>(1);

  constructor(protected router: Router) {}

  /** Register the observer returning the observable emitting on the specified action(s) */
  public register(action: string): Observable<ActionData> {
    
    // Returns the action observable
    return this.observers$.pipe( 
    
      // Filters the request based on the action code
      filter( ({ route }) => action === this.actionCode(route) ), 
      
      // Extract the data from the route
      map( ({ route }) => this.actionData(route) ) 
    );
  }

  /** Computes the action code from teh route */
  protected actionCode(route: ActivatedRouteSnapshot): string {
    let returnTemp;
    if(route != null){
        if(route!.routeConfig){
            returnTemp = route!.routeConfig!.path
        } else {
            returnTemp = ''
        }
    } else {
        returnTemp =''
    }

    route!.routeConfig!.path || ''
    return route?.data['actionMatch'] || returnTemp;
  }

  /** Computes the axtion data from the route queryParams */
  protected actionData(route: ActivatedRouteSnapshot): ActionData {
    let aaa;
    // let aaa: Map<String, any>;
    let obj1;
        // Computes the data object from the route's query parameters
        return route.queryParamMap.keys.reduce( (data, key) => {
            // aaa= data as Map<String, any>;
            // aaa.set() = 'fgfd';
            obj1={key: route.queryParamMap.get(key)};
            aaa = {...data, ...obj1}
            // aaa[key] = route.queryParamMap.get(key);
            // aaa.set(key, route.queryParamMap.get(key));
            // Adds the single key, value pair
            // data[key] = route.queryParamMap.get(key);
            // Returns the object
            return aaa;
          }, {});
  }
 
  // Implements single route user authentication guarding
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): UrlTree {
  
    // Pushes the request using data coming from the route
    this.observers$.next( { route, state } );

    // Always prevents the real routing by redirecting to the current url instead of returning false.
    // This way the router will always end up loading a page even when the requested action link comes
    // from an extrnal redirection causing the app to load from scratch.
    return this.router.parseUrl(this.router.url);
  }
}