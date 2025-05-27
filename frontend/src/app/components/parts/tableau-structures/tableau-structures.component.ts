import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Subscription } from 'rxjs';

//Affiche la liste des structures sur la page diagnostic-visualisation en lecture seule
@Component({
  selector: 'app-tableau-structures',
  templateUrl: './tableau-structures.component.html',
  styleUrls: ['./tableau-structures.component.css'],
  standalone:true,
  imports:[CommonModule,MatListModule]
})
export class TableauStructuresComponent implements OnInit,OnDestroy{
  
  @Input() diagnostic:Diagnostic = new Diagnostic();
  structures:string[] =[];
  private structuresSubscription?:Subscription;
  private diagnosticService = inject(DiagnosticService);


  ngOnInit(): void {
    this.structuresSubscription = this.diagnosticService.getStructures(this.diagnostic.id_diagnostic).subscribe(
      reponses =>{
        this.structures = reponses.structures.sort();
      }
    )
  }

  ngOnDestroy(): void {
    this.structuresSubscription?.unsubscribe();
  }
}
