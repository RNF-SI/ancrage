import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableDataSourcePaginator } from '@angular/material/table';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Site } from '@app/models/site.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SiteService } from '@app/services/sites.service';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '@app/utils/labels';
import { ChoixActeursComponent } from '../parts/choix-acteurs/choix-acteurs.component';

@Component({
  selector: 'app-diagnostic-visualisation',
  templateUrl: './diagnostic-visualisation.component.html',
  styleUrls: ['./diagnostic-visualisation.component.css'],
  standalone:true,
  imports: [ChoixActeursComponent,CommonModule,MatButtonModule]
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
  private route = inject(ActivatedRoute);
  private siteService = inject(SiteService);
  private router = inject(Router)
  id_diagnostic:number = 0;
  labels = new Labels();

  formGroup = this.fb.group({
      id_diagnostic: [0, [Validators.required]],
      nom: ['', [Validators.required]],
      sites: this.fb.control<Site[]>([], [Validators.required]),  
      acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
      created_by: [0, [Validators.required]],
      id_organisme: [0, [Validators.required]],
      modified_by: [0, [Validators.required]],
  });
    

  ngOnInit(): void {
    this.previousPage = localStorage.getItem("previousPage")!;
    this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_diagnostic = params['id_diagnostic'];          
          if (this.id_diagnostic) {
        
            this.diagSubscription = this.diagnosticService.get(this.id_diagnostic).subscribe(diag =>{
              this.diagnostic = diag;
              this.actors = diag.acteurs;
            });
            
          }
    });

  }

  navigate= (path:string,diagnostic:Diagnostic):void =>{
    localStorage.setItem("previousPage",this.router.url);
    this.siteService.navigateAndReload(path,diagnostic);
  }
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.diagSubscription?.unsubscribe();
  }

}
