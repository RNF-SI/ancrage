import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, Input, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Commune } from '@app/models/commune.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { CommuneService } from '@app/services/commune.service';
import { StateService } from '@app/services/state.service';
import { Labels } from '@app/utils/labels';
import { Subscription } from 'rxjs';
import { Document } from '@app/models/document.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Acteur } from '@app/models/acteur.model';

@Component({
  selector: 'app-import',
  imports: [
    CommonModule, 
    MatFormFieldModule, 
    ReactiveFormsModule, 
    MatSelectModule, 
    FormsModule, 
    MatInputModule, 
    MatAutocompleteModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css'
})
export class ImportComponent implements OnDestroy{
  labels = new Labels();

  fb = inject(FormBuilder);
  formGroup = this.fb.group({
    commune: this.fb.control<Commune | null>(null, [Validators.required]),
    file: ["",Validators.required]
  });
  filteredTowns: Commune[] = [];

  readonly communeControl = this.formGroup.get('commune')!;
  readonly communeValue = toSignal(this.communeControl.valueChanges, { initialValue: this.communeControl.value });
  readonly nom = computed(() => this.formGroup.get('nom')?.value ?? '');
  readonly prenom = computed(() => this.formGroup.get('prenom')?.value ?? '');
  readonly fonction = computed(() => this.formGroup.get('fonction')?.value ?? '');
  readonly structure = computed(() => this.formGroup.get('structure')?.value ?? '');
  uniqueTowns:Commune[] = [];
  private communeService = inject(CommuneService);
  private communeSub?:Subscription;
  private importSubscription?:Subscription;
  private diagnosticService = inject(DiagnosticService);
  @Input() diagnostic = new Diagnostic();
  dragOver = false;
  file: File | null = null;

  constructor() {
    
    effect(() => {
      this.communeSub = this.communeService.getAll().subscribe(communes =>{
        this.uniqueTowns = communes;
      })
    });

    effect(() => {
      const value = this.communeValue();
      const filterValue = typeof value === 'string' ? value : value?.nom_com + "(" + value?.insee_com + ")" || '';
      this.filteredTowns = this._filter(filterValue);
    });
  }

  private _normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  
  //Filtrage amélioré pour rechercher par nom, code département ou code INSEE
  private _filter(filterValue: string): Commune[] {
    const normalizedInput = this._normalize(filterValue);
  
    return this.uniqueTowns
      .filter(t => {
        const nomMatch = this._normalize(t.nom_com).includes(normalizedInput);
        const codeDptMatch = t.code_dpt && this._normalize(t.code_dpt).includes(normalizedInput);
        const inseeMatch = this._normalize(t.insee_com).includes(normalizedInput);
        return nomMatch || codeDptMatch || inseeMatch;
      })
      .slice(0, 30);
  }

  //Autocomplétion - Affichage amélioré avec code département
  displayFn(commune: Commune): string {
    if (!commune) return '';
    const codeDpt = commune.code_dpt || '';
    return `${commune.nom_com} (${codeDpt})`;
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
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.file = event.dataTransfer.files[0];
      this.formGroup.get('file')?.setValue(this.file.name)
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.formGroup.get('file')?.setValue(this.file.name)
    }
  }
  


  import(event: Event){
    event.preventDefault();
    if(this.formGroup.valid){
      let acteur = new Acteur();
      acteur.commune = this.formGroup.get('commune')?.value!;
      acteur.diagnostic = this.diagnostic;

      this.importSubscription = this.diagnosticService.importData(this.file!,acteur).subscribe();
    }
    

  }

  ngOnDestroy(): void {
    this.communeSub?.unsubscribe();
    this.importSubscription?.unsubscribe();
  }

}
