import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { GeoJsonPoint, GeoJsonSiteGeom } from '@app/interfaces/site.interface';
import { Site } from '@app/models/site.model';
import { FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatButtonModule } from '@angular/material/button';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { debounceTime, merge } from 'rxjs';
import { SiteService } from '@app/services/sites.service';
import { MapComponent } from "../parts/map/map.component";
import { ActivatedRoute, Params } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Departement } from '@app/models/departement.model';
import { DepartementService } from '@app/services/departement.service';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { Labels } from '@app/utils/labels';
import { toSignal } from '@angular/core/rxjs-interop';
import { StateService } from '@app/services/state.service';
import {
  getSitePolygonGeometry,
  parseStoredSiteGeometry,
  parseStoredSitePoint,
} from '@app/utils/site-geometry';

//Modifie ou crée un site
@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.css'],
    imports: [
      MatInputModule, 
      MatFormFieldModule, 
      CommonModule, 
      FormsModule, 
      MatSelectModule, 
      MatButtonModule, 
      MapComponent, 
      ReactiveFormsModule
    ]
})
export class SiteComponent implements OnDestroy{
  
  sites:Site[]=[];
  titleSite="Nouveau site";
  titleModif="Modification du site";
  labels = new Labels();
  uniqueHabitats = signal<Nomenclature[]>([]);
  uniqueStatuts = signal<Nomenclature[]>([]);
  uniqueDepartements = signal<Departement[]>([]);
  private readonly defaultLatitude = '47.316667';
  private readonly defaultLongitude = '5.016667';
  private nomenclatureService = inject(NomenclatureService);
  private siteService = inject(SiteService)
  private nomenclatureSubscription!: Subscription;
  private siteSubscription!: Subscription;
  mnemoHabitats = "habitats";
  mnemoStatuts = "statut";
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
    id_site: [0],
    nom: ['', [Validators.required]],
    /* habitats: this.fb.control<Nomenclature[]>([], [Validators.required]),   */
    type: this.fb.control<Nomenclature | null>(null, [Validators.required]),
    departements: this.fb.control<Departement[]>([], [Validators.required]),  
    slug:[""],
    position_y: [this.defaultLatitude, [Validators.required, Validators.pattern('^(\\+|-)?(?:90(?:\\.0{1,6})?|(?:[0-9]|[1-8][0-9])(?:\\.[0-9]{1,6})?)$')]],
    position_x: [this.defaultLongitude, [Validators.required, Validators.pattern('^(\\+|-)?(?:180(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\\.[0-9]{1,6})?))$')]],
    geom: this.fb.control<GeoJsonSiteGeom | null>(null),
    geom_pt: this.fb.control<GeoJsonPoint | null>(null),
  });
  site = signal<Site>(new Site());
  routeSubscription?: Subscription;
  route = inject(ActivatedRoute)
  slug = signal<string>("");
  id_site = signal<number>(0);
  changePosition = true;
  diagnostic:Diagnostic = new Diagnostic();
  private departementService = inject(DepartementService);
  private authService = inject(AuthService);
  user_id = signal<number>(0);
  previousPage="";
  showMap=true;
  mapInstanceKey = Date.now();
  routeParams = toSignal(this.route.params, { initialValue: {} });
  private stateService = inject(StateService);
  private deptIntersectSubscription?: Subscription;
  private skipDeptAutoFill = false;
  private lastDeptGeomKey = '';

  constructor() {
    this.setupDepartementAutoFill();
    effect(() => {
      this.user_id.set(this.authService.getCurrentUser().id_role);
      this.diagnostic = this.stateService.getCurrentDiagnostic()!;    
      
      const { id_site, slug } = this.routeParams() as Params;
      
      const id = Number(id_site);
      const slugValue = slug as string;
      this.id_site.set(id);
      this.slug.set(slugValue);
      this.mapInstanceKey = Date.now();
      const habitats$ = this.nomenclatureService.getAllByType(this.mnemoHabitats);
      const statuts$ = this.nomenclatureService.getAllByType(this.mnemoStatuts);
      const departements$ = this.departementService.getAll();
      //Modification
      if (id && slugValue) {
        const site$ = this.siteService.get(this.id_site(),this.slug());
        this.previousPage = this.stateService.getCurrentPreviousPage();
        forkJoin([habitats$, statuts$, site$,departements$]).subscribe(([habitats, statuts, site,departements]) => {
          this.uniqueHabitats.set(habitats);
          this.uniqueStatuts.set(statuts);
          this.uniqueDepartements.set(departements);
          this.departementService.sortByName(this.uniqueDepartements());
          this.site.set(site);
          /* this.site.habitats = (this.site.habitats || []).map(hab =>
            this.uniqueHabitats.find(uh => uh.id_nomenclature === hab.id_nomenclature) || hab
          ); */
          this.site().departements = (this.site().departements|| []).map(dpt =>
            this.uniqueDepartements().find(ud => ud.id_departement === dpt.id_departement) || dpt
          );
          this.site().type = this.uniqueStatuts().find(stat => stat.id_nomenclature === this.site().type?.id_nomenclature) || this.site().type;
  
          this.patchvalue();
          this.titleSite = this.titleModif;
        });
      } else {
        this.previousPage = this.stateService.getCurrentPageCreationDiag();
        //Création
        forkJoin([/* habitats$, */ statuts$,departements$]).subscribe(([/* habitats, */ statuts,departements]) => {
          /* this.uniqueHabitats = habitats; */
          this.uniqueStatuts.set(statuts);
          this.uniqueDepartements.set(departements);
          this.departementService.sortByName(this.uniqueDepartements());
        });
      }
      
    });
  }

  patchvalue(){
    const geom = getSitePolygonGeometry(this.site()) ?? parseStoredSiteGeometry(this.site().geom);
    const geomPt = parseStoredSitePoint(this.site().geom_pt);

    this.skipDeptAutoFill = true;
    this.formGroup.patchValue({
      id_site: this.site().id_site > 0 ? this.site().id_site :0,
      nom: this.site().nom,
      /* habitats: this.site.habitats, */
      departements: this.site().departements,
      type: this.site().type.id_nomenclature > 0 ? this.site().type :null,
      position_y: this.site().position_y,
      position_x: this.site().position_x,
      geom,
      geom_pt: geomPt,
      slug: this.site().slug
    });
    this.skipDeptAutoFill = false;
    this.lastDeptGeomKey = '';
    this.updateDepartementsFromGeometry();
  }

  private setupDepartementAutoFill(): void {
    const geomCtrl = this.formGroup.get('geom')!;
    const geomPtCtrl = this.formGroup.get('geom_pt')!;

    this.deptIntersectSubscription = merge(
      geomCtrl.valueChanges,
      geomPtCtrl.valueChanges,
    ).pipe(debounceTime(300)).subscribe(() => this.updateDepartementsFromGeometry());
  }

  private geometryKeyForDepartments(
    geom: GeoJsonSiteGeom | null,
    geomPt: GeoJsonPoint | null
  ): string {
    if (geom) return `geom:${JSON.stringify(geom)}`;
    if (geomPt) return `pt:${JSON.stringify(geomPt)}`;
    return '';
  }

  private updateDepartementsFromGeometry(): void {
    if (this.skipDeptAutoFill) return;

    const geom = parseStoredSiteGeometry(this.formGroup.get('geom')?.value);
    const geomPt = parseStoredSitePoint(this.formGroup.get('geom_pt')?.value);
    const geomKey = this.geometryKeyForDepartments(geom, geomPt);
    if (!geomKey || geomKey === this.lastDeptGeomKey) return;

    this.lastDeptGeomKey = geomKey;
    const positionX = this.formGroup.get('position_x')?.value as string;
    const positionY = this.formGroup.get('position_y')?.value as string;

    this.departementService.findByIntersection(geom, geomPt, positionX, positionY).subscribe(departements => {
      if (!departements.length) return;

      const matched = departements.map(dpt =>
        this.uniqueDepartements().find(ud => ud.id_departement === dpt.id_departement) ?? dpt
      );

      this.skipDeptAutoFill = true;
      this.formGroup.patchValue({ departements: matched }, { emitEvent: false });
      this.skipDeptAutoFill = false;
    });
  }
 
  compareNomenclatures(o1: Nomenclature, o2: Nomenclature): boolean {
    return o1 && o2 ? o1.id_nomenclature === o2.id_nomenclature : o1 === o2;
  }

  compareDepartements(o1: Departement, o2: Departement): boolean {
    return o1 && o2 ? o1.id_departement === o2.id_departement: o1 === o2;
  }

  //Enregistre le site
  cancelSite(): void {
    this.navigate(this.previousPage, this.diagnostic);
  }

  recordSite(event: Event){
    
    event.preventDefault();
    
    this.site.set(Object.assign(new Site(),this.formGroup.value))
    if(this.formGroup.valid){
      //Ajout
      if (this.site().id_site == 0){
        this.site().created_by=this.user_id();
        this.siteSubscription = this.siteService.add(this.site()).subscribe(site => {
          this.afterSiteSaved(site);
        });
      }else{
        //Modification
        this.site().modified_by=this.user_id();
        this.siteSubscription = this.siteService.update(this.site()).subscribe(site => {
          this.afterSiteSaved(site);
        });
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  private afterSiteSaved(site: Site): void {
    const index = this.diagnostic.sites.findIndex(s => s.id_site === site.id_site);
    if (index >= 0) {
      this.diagnostic.sites[index] = site;
    } else {
      this.diagnostic.sites.push(site);
    }
    this.navigate(this.previousPage, this.diagnostic);
  }

  navigate(path:string,diagnostic:Diagnostic){
    this.siteService.navigateAndCache(path,diagnostic,undefined,true);
  }
  ngOnDestroy(): void {
    this.nomenclatureSubscription?.unsubscribe();
    this.siteSubscription?.unsubscribe();
    this.deptIntersectSubscription?.unsubscribe();
  }
}


