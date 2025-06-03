import { AfterViewInit, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Observable, startWith, map, forkJoin, Subscription } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { MotCleService } from '@app/services/mot-cle.service';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MatButtonModule } from '@angular/material/button';
import { Reponse } from '@app/models/reponse.model';
import { Acteur } from '@app/models/acteur.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-mots-cles-zone',
  templateUrl: './mots-cles-zone.component.html',
  styleUrls: ['./mots-cles-zone.component.scss'],
  standalone:true,
  imports: [
    MatChipsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,

  ]
})
export class MotsClesZoneComponent implements AfterViewInit,OnDestroy{
  
  keywords: string[] = [];
  inputCtrl = new FormControl('');
  allKeywords: string[] = [];
  separatorKeys = [ENTER, COMMA];
  @Input() diagnostic = new Diagnostic();
  categories: Nomenclature[]=[];
  connectedDropListsIds: string[] = [];
  motsClesReponse:MotCle[]=[];
  @Input() id_acteur = 0;
  @Input() noResponse = new Nomenclature();
  @Input() createReponse!: (id_question: number, cr?: Nomenclature) => void;
  @Input() reponses:Reponse[]=[]
  filteredKeywords: Observable<string[]> = this.inputCtrl.valueChanges.pipe(
    startWith(''),
    map(value => this._filter(value || ''))
  );
  private forkSub?:Subscription;
  private nomenclatureService = inject(NomenclatureService);
  private motCleService = inject(MotCleService);
  showUnclassifiedError = false;
  private toastr = inject(ToastrService);

  ngAfterViewInit(): void {
    
    this.connectedDropListsIds = this.categories.map(c => c.libelle);
    const keywordsDiag$ = this.motCleService.getAllByDiag(this.diagnostic.id_diagnostic);
    const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
    const keywordsActor$ = this.motCleService.getKeywordsByActor(this.id_acteur);
    this.forkSub = forkJoin([keywordsDiag$,sections$,keywordsActor$]).subscribe(([keywords,sections,keywordsActor]) => {
      if (keywords.length>0){
        for (let i = 0;i<keywords.length;i++){
          this.allKeywords.push(keywords[i].nom);
        }
      }
      this.categories=sections;
      this.motsClesReponse = [];
      for (const cat of this.categories) {
        cat.mots_cles = [];
      }
      
      /* this.setKeywords(keywordsActor); */
      
    });
  } 

  hasUnclassifiedKeywords(): boolean {
    const nonClasse = this.categories.find(c => c.libelle === "Non classés");
    
    return nonClasse?.mots_cles?.length! > 0;
  }

  handleKeydown(event: KeyboardEvent): void {

    if (this.separatorKeys.includes(event.keyCode)) {
      event.preventDefault();
      this.addKeyword(this.inputCtrl.value!);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addKeyword(event.option.value);
  }

  remove(keyword: string): void {
    this.keywords = this.keywords.filter(k => k !== keyword);
  }

  removeKeyword(cat: Nomenclature, keyword: MotCle): void {
    const index = cat.mots_cles?.indexOf(keyword);
    if (index! > -1) {
      cat.mots_cles?.splice(index!, 1);
    }
  }
  
  addKeyword(value: string): void {
    const kw = value?.trim();
    if (!kw) return;
  
    const nonClasse = this.categories.find(c => c.libelle === "Non classés");
    if (!nonClasse) return;
  
    const exists = this.categories.some(cat =>
      cat.mots_cles?.some(k => k.nom === kw)
    );
  
    if (!exists) {
      let mot_cle:MotCle = new MotCle();
      mot_cle.nom = value;
      nonClasse.mots_cles?.push(mot_cle);
      this.allKeywords.push(mot_cle.nom);
    
    }
  
    this.inputCtrl.setValue('');
  }

  private _filter(value: string): string[] {
    const allUsedKeywords = this.categories.flatMap(cat => cat.mots_cles?.map(k => k.nom) || []);
    return this.allKeywords.filter(option =>
      option.toLowerCase().includes(value.toLowerCase()) &&
      !allUsedKeywords.includes(option)
    );
  }

  drop(event: CdkDragDrop<MotCle[] | undefined>, targetCategory: Nomenclature): void {
    const draggedKeyword: MotCle = event?.previousContainer.data![event.previousIndex];
    if (!draggedKeyword) return;
  
    const isShiftPressed = (event.event as MouseEvent | PointerEvent)?.shiftKey;
  
    const prevCategory = this.categories.find(cat =>
      cat.mots_cles?.some(k => k.id_mot_cle === draggedKeyword.id_mot_cle)
    );
  
    // Si on n'est pas en mode shift (multi-catégories), on retire le mot-clé des autres catégories
    if (!isShiftPressed) {
      for (const cat of this.categories) {
        if (cat.mots_cles) {
          cat.mots_cles = cat.mots_cles.filter(mc => mc.id_mot_cle !== draggedKeyword.id_mot_cle);
        }
      }
      draggedKeyword.categories = [targetCategory];
    } else {
      // Ajout dans la catégorie uniquement si pas déjà présent
      const inTargetCat = draggedKeyword.categories.some(c => c.id_nomenclature === targetCategory.id_nomenclature);
      if (!inTargetCat) {
        draggedKeyword.categories.push(targetCategory);
      }
    }
  
    // MAJ du diagnostic
    draggedKeyword.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
    console.log(draggedKeyword);
    // MAJ dans la liste temporaire
    const index = this.motsClesReponse.findIndex(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle);
    if (index >= 0) {
      this.motsClesReponse[index] = draggedKeyword;
    } else {
      this.motsClesReponse.push(draggedKeyword);
    }
  
    // Ajout visuel dans la catégorie cible
    targetCategory.mots_cles = targetCategory.mots_cles || [];
    const alreadyThere = targetCategory.mots_cles.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle);
    if (!alreadyThere) {
      targetCategory.mots_cles.splice(event.currentIndex, 0, draggedKeyword);
    }
  }

  sendResponse(){
    if (this.hasUnclassifiedKeywords()) {
      this.toastr.warning("Merci de classer tous les mots-clés avant d'envoyer votre réponse.", "Mots-clés non classés");
      return;
    }
    let reponse = new Reponse();
    reponse.question = this.reponses[this.reponses.length-1].question
    reponse.question!.indications="Sans indicateur";
    reponse.valeur_reponse = this.noResponse;
    reponse.mots_cles = this.motsClesReponse;
    reponse.acteur = new Acteur();
    reponse.acteur.id_acteur = this.id_acteur;
    for (let i=0;i<reponse.mots_cles.length;i++){
      for (let j=0;j<reponse.mots_cles[i].categories.length;j++){
        reponse.mots_cles[i].categories[j].mots_cles=[];
      }
    }
    console.log(reponse);
    this.reponses[this.reponses.length-1]=reponse;
    this.createReponse(reponse.question!.id_question);
    

  }

  setKeywords(keywordsActor:MotCle[]){
    if (keywordsActor.length>0) {
      const motsCles = keywordsActor;
      
      for (const mc of motsCles) {
        // 🔄 Pour chaque catégorie associée à ce mot-clé
        mc.diagnostic =  new Diagnostic();
        mc.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
        for (const catRef of mc.categories || []) {
          const cat = this.categories.find(c => c.id_nomenclature === catRef.id_nomenclature);
          if (cat) {
            cat.mots_cles = cat.mots_cles || [];
    
            // Évite les doublons
            const deja = cat.mots_cles.find(k => k.id_mot_cle === mc.id_mot_cle);
            if (!deja) {
              cat.mots_cles.push(mc);
            }
          }
        }
    
        // 📦 Ajout dans la liste des mots-clés liés à la réponse
        const dejaDansReponse = this.motsClesReponse.some(k => k.id_mot_cle === mc.id_mot_cle);
        if (!dejaDansReponse) {
          this.motsClesReponse.push(mc);
        }
        
      }
      
    }
  }
  ngOnDestroy(): void {
    this.forkSub?.unsubscribe();
  }
}
