import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableDataSourcePaginator } from '@angular/material/table';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Site } from '@app/models/site.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { forkJoin, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
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
import { environment } from 'src/environments/environment';
import { MapComponent } from '../parts/map/map.component';
import { MotsClesZoneComponent } from '../parts/mots-cles-zone/mots-cles-zone.component';

@Component({
  selector: 'app-diagnostic-visualisation',
  templateUrl: './diagnostic-visualisation.component.html',
  styleUrls: ['./diagnostic-visualisation.component.css'],
  standalone:true,
  imports: [ChoixActeursComponent, CommonModule, MatButtonModule, GraphiquesComponent, GraphiquesComponent, MatTabsModule, MenuLateralComponent, MenuLateralComponent, TableauStructuresComponent,TableauStructuresComponent,MapComponent,MotsClesZoneComponent]
})
export class DiagnosticVisualisationComponent implements OnInit,OnDestroy{

  diagnostic: Diagnostic = new Diagnostic();
  actors: Acteur[] = [];
  uniqueDiagnostics: Diagnostic[] = [];
  selectedDiagnostic: Diagnostic = new Diagnostic();
  uniqueCategories: Nomenclature[] = [];
  uniqueDepartments: Departement[] = [];
  selectedCategory: Nomenclature = new Nomenclature();
  selectedDepartment: Departement = new Departement();
  actorsSelected: MatTableDataSource<Acteur,MatTableDataSourcePaginator> = new MatTableDataSource();
  uniqueActors: Acteur[] = [];
  hideFilters=true;
  previousPage ="";
  private fb = inject(FormBuilder);
  private diagnosticService = inject(DiagnosticService);
  private routeSubscription?:Subscription;
  private diagSubscription?:Subscription;
  route = inject(ActivatedRoute);
  private siteService = inject(SiteService);
  private nomenclatureService = inject(NomenclatureService)
  id_diagnostic:number = 0;
  labels = new Labels();
  themes:Nomenclature[] = [];
  private docsSubscription?:Subscription;
  private docReadSub?:Subscription;
  environment = environment.flask_server + 'fichiers/';
  file?:Blob;

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
  slug="";
  files: File[] = [];
  dragOver = false;

  ngOnInit(): void {
    this.previousPage = localStorage.getItem("previousPage")!;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_diagnostic = params['id_diagnostic'];   
          this.slug = params['slug'];
          //Récupération des données     
          if (this.id_diagnostic && this.slug) {
            const diag$ = this.diagnosticService.get(this.id_diagnostic,this.slug);
            const themes$ = this.nomenclatureService.getAllByType("thème");
            forkJoin([diag$, themes$]).subscribe(([diag, themes]) => {
              this.diagnostic = diag;
              this.actors = diag.acteurs;
              this.themes = themes;
              
            });
          }
    });

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
      doc.diagnostic = this.diagnostic;
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
      this.diagnostic = diag;
      console.log(diag);
    });

    
  }
  
  //Navigation et mise en cache
  navigate= (path:string,diagnostic:Diagnostic):void =>{
    this.siteService.navigateAndCache(path,diagnostic);
  }

  //Exporte le tableau d'acteurs en fichier csv
  exportCSV(){
    let acteurs:Acteur[] = this.diagnostic.acteurs;
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
    link.download = 'acteurs - '+this.diagnostic.nom+'.csv';
    link.click();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagSubscription?.unsubscribe();
    this.docsSubscription?.unsubscribe();
    this.docReadSub?.unsubscribe();
  }

}
