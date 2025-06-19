import { Component, inject, OnDestroy, OnInit, ViewChild,signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Site } from '@app/models/site.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { forkJoin, Subscription } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SiteService } from '@app/services/sites.service';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '@app/utils/labels';
import { ChoixActeursComponent } from '../parts/choix-acteurs/choix-acteurs.component';
import { GraphiquesComponent } from "../parts/graphiques/graphiques.component";
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { MenuLateralComponent } from "../parts/menu-lateral/menu-lateral.component";
import { TableauStructuresComponent } from "../parts/tableau-structures/tableau-structures.component";
import { Document } from '@app/models/document.model';
import { MapComponent } from '../parts/map/map.component';
import { MotsClesZoneComponent } from '../parts/mots-cles-zone/mots-cles-zone.component';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { MatDialog } from '@angular/material/dialog';
import { AlerteDatePublicationComponent } from '../alertes/alerte-date-publication/alerte-date-publication.component';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

@Component({
    selector: 'app-diagnostic-visualisation',
    templateUrl: './diagnostic-visualisation.component.html',
    styleUrls: ['./diagnostic-visualisation.component.css'],
    standalone:true,
    imports: [ChoixActeursComponent, CommonModule, MatButtonModule, GraphiquesComponent, GraphiquesComponent, MatTabsModule, MenuLateralComponent, MenuLateralComponent, TableauStructuresComponent, TableauStructuresComponent, MapComponent, MotsClesZoneComponent,MatMomentDateModule]
})
export class DiagnosticVisualisationComponent implements OnInit,OnDestroy{

  diagnostic = signal<Diagnostic>(new Diagnostic());
  actors = signal<Acteur[]>([]);
  uniqueDiagnostics: Diagnostic[] = [];
  selectedDiagnostic: Diagnostic = new Diagnostic();
  uniqueCategories: Nomenclature[] = [];
  uniqueDepartments: Departement[] = [];
  selectedCategory: Nomenclature = new Nomenclature();
  selectedDepartment: Departement = new Departement();
  actorsSelected: MatTableDataSource<Acteur> = new MatTableDataSource<Acteur>();
  uniqueActors: Acteur[] = [];
  hideFilters=true;
  previousPage = signal<string>('');
  private fb = inject(FormBuilder);
  private diagnosticService = inject(DiagnosticService);
  private routeSubscription?:Subscription;
  private diagSubscription?:Subscription;
  route = inject(ActivatedRoute);
  private siteService = inject(SiteService);
  private nomenclatureService = inject(NomenclatureService)
  id_diagnostic = signal<number>(0);
  labels = new Labels();
  themes = signal<Nomenclature[]>([]);
  private docsSubscription?:Subscription;
  private docReadSub?:Subscription;
  file?:Blob;
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  private router = inject(Router);

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  formGroup = this.fb.group({
      id_diagnostic: [0, [Validators.required]],
      nom: ['', [Validators.required]],
      sites: this.fb.control<Site[]>([], [Validators.required]),  
      acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
      created_by: [0, [Validators.required]],
      id_organisme: [0, [Validators.required]],
      modified_by: [0, [Validators.required]],
  });
  slug = signal<string | null>(null);
  files: File[] = [];
  dragOver = false;
  id_role = signal<number>(0);
  is_read_only = signal<boolean>(false);
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });
  constructor() {
    effect(() => {
      const { id_diagnostic, slug } = this.routeParams() as Params;
      const id = Number(id_diagnostic);
      const slugValue = slug as string;
  
      if (id && slugValue) {
        this.id_diagnostic.set(id);
        this.slug.set(slugValue);
  
        forkJoin({
          diag: this.diagnosticService.get(id, slugValue),
          themes: this.nomenclatureService.getAllByType('thème'),
        }).subscribe(({ diag, themes }) => {
          this.diagnostic.set(diag);
          this.themes.set(themes);
  
          const user = this.authService.getCurrentUser();
          this.id_role.set(user.id_role);
  
          const isOwner = user.id_role === diag.created_by;
          const isReadOnly = !isOwner || diag.is_read_only;
  
          this.is_read_only.set(isReadOnly);
        });
      }
    });
  }

  ngOnInit(): void {
    this.previousPage.set(localStorage.getItem('previousPage') ?? '');

    
  }
  //Cache ou affiche le menu en fonction de l'onglet choisi
  onTabChange(event: MatTabChangeEvent) {
    
    let menu = document.getElementById("menu");
    if (event.index === 3) { 
    
      if (menu?.className == "invisible"){
        menu?.classList.remove("invisible");
        menu?.classList.add("visible");
      }
      
      
    }else{
      if (menu?.className == "visible"){
        menu?.classList.remove("visible");
        menu?.classList.add("invisible");
      }
    }
  }
  
  //Fonctions pour le drag & drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files) {
      this.files.push(...Array.from(event.dataTransfer.files));
    }
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.files.push(...Array.from(input.files));
    }
  }

  //Télecharge le fichier
  getFile(filename:string){
    this.docReadSub = this.diagnosticService.downloadFile(filename).subscribe(file =>{
      this.file=file;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(this.file);
      link.download = filename;
      link.click();
    });
  }

  //Envoie les fichiers au serveur
  uploadFiles() {
    const documents: Document[] = this.files.map(file => {
      const doc = new Document();
      doc.nom = file.name;
      doc.diagnostic = this.diagnostic();
      return doc;
    });
  
    const formData = new FormData();
  
    // Ajout des fichiers
    this.files.forEach(file => {
      formData.append('files', file);
    });
  
    // Ajout du JSON des documents
    formData.append('documents', JSON.stringify(documents.map(d => d.toJson())));

    this.docsSubscription = this.diagnosticService.sendFiles(formData).subscribe(diag =>{
      this.diagnostic.set(diag);
   
    });
    
    
  }
  
  //Navigation et mise en cache
  navigate= (path:string,diagnostic:Diagnostic):void =>{
    localStorage.setItem("pageDiagnostic",this.router.url);
    this.siteService.navigateAndCache(path,diagnostic);
  }

  //Exporte le tableau d'acteurs en fichier csv
  exportCSV(){
    let acteurs:Acteur[] = this.diagnostic().acteurs;
    const separator = ';';
    const headers = [
      'id_acteur',
      'nom',
      'prenom',
      'fonction',
      'structure',
      'mail',
      'telephone',
      'profil',
      'commune',
      'categories'
    ];

    const csvRows = [
      headers.join(separator),
      ...acteurs.map(a => [
        a.id_acteur,
        a.nom,
        a.prenom,
        a.fonction,
        a.structure,
        a.mail,
        a.telephone,
        a.profil?.libelle|| '',
        a.commune?.nom_com || '',
        (a.categories || []).map(c => c.libelle).join(', ')
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(separator))
    ];

    const csvContent = csvRows.join('\n');
    const BOM = '\uFEFF';  // UTF-8 BOM
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'acteurs - '+this.diagnostic().nom+'.csv';
    link.click();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagSubscription?.unsubscribe();
    this.docsSubscription?.unsubscribe();
    this.docReadSub?.unsubscribe();
  }

  //Affiche la popup pour saisir la date de publication
  openAlertDate(){
    const dialogRef = this.dialog.open(AlerteDatePublicationComponent, {
              data: {
                labels: this.labels,
                diagnostic:this.diagnostic,
                previousPage:this.previousPage,
                
              }
            });
            dialogRef.afterClosed().subscribe(diagnostic => {
              if (diagnostic) {
                this.diagnostic = diagnostic;
              }
            });
  }

}
