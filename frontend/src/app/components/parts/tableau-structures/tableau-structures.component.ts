import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Subscription } from 'rxjs';

//Affiche la liste des structures sur la page diagnostic-visualisation en lecture seule
@Component({
    selector: 'app-tableau-structures',
    templateUrl: './tableau-structures.component.html',
    styleUrls: ['./tableau-structures.component.css'],
    imports: [CommonModule, MatListModule]
})
export class TableauStructuresComponent{
  
  diagnostic = input<Diagnostic>(new Diagnostic());
  structures = signal<string[]>([])
  private diagnosticService = inject(DiagnosticService);
  subscription?:Subscription;
  
  constructor(){
    effect(() => {
      const id = this.diagnostic().id_diagnostic;
      if (id > 0) {
        
        this.subscription = this.diagnosticService.getStructures(id).subscribe(rep =>{
          this.structures.set(rep.structures);
        });
      }
      
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}
