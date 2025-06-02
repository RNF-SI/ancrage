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
  afom = new Nomenclature();
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
    const afomQuest$ = this.nomenclatureService.getTheme("AFOM",this.id_acteur);
    this.forkSub = forkJoin([keywordsDiag$,sections$,afomQuest$]).subscribe(([keywords,sections,afomQuestion]) => {
      if (keywords.length>0){
        for (let i = 0;i<keywords.length;i++){
          this.allKeywords.push(keywords[i].nom);
        }
      }
      this.categories=sections;
      
      for (const cat of this.categories) {
        if (!cat.mots_cles) {
          cat.mots_cles = [];
        }
      }
      this.afom = afomQuestion[0];
      if (this.afom.questions![0].reponses!.length > 0){
        const motsCles = this.afom.questions![0].reponses![0].mots_cles || [];

        for (const mc of motsCles) {
          // Recherche de la catégorie correspondante
          const cat = this.categories.find(c => c.id_nomenclature === mc.categorie?.id_nomenclature);
          
          if (cat) {
            cat.mots_cles = cat.mots_cles || [];
            
            // Vérifie que le mot-clé n’est pas déjà présent (évite les doublons si rechargement)
            const deja = cat.mots_cles.find(k => k.nom === mc.nom);
            if (!deja) {
              cat.mots_cles.push(mc);
            }
          }

          // Stocke dans la réponse locale à envoyer plus tard
          this.motsClesReponse.push(mc);
        }
      }

     
    });
  } 

  hasUnclassifiedKeywords(): boolean {
    const nonClasse = this.categories.find(c => c.libelle === "Non classés");
    console.log(nonClasse?.mots_cles?.length! > 0);
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
    let draggedKeyword: MotCle = event?.previousContainer.data![event.previousIndex];
   
    const prevCategory = this.categories.find(cat =>
      cat.mots_cles?.includes(draggedKeyword)
    );

    if (!prevCategory) return;

    // Supprimer
    prevCategory.mots_cles?.splice(event.previousIndex, 1);

    // Mise à jour
    if (draggedKeyword) {
      draggedKeyword.categorie.id_nomenclature = targetCategory.id_nomenclature;
      draggedKeyword.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
      let check =false;
      for (let i =0;i<this.motsClesReponse.length;i++){
       
        if (this.motsClesReponse[i].nom == draggedKeyword.nom){
          check=true;
          if(this.motsClesReponse[i].categorie.id_nomenclature!=draggedKeyword.categorie.id_nomenclature){
            this.motsClesReponse.splice(i);
            this.motsClesReponse.push(draggedKeyword);
            break;
          }else{
            break;
          }
        }
      }
      if(!check){
        this.motsClesReponse.push(draggedKeyword);
      }
      
    }

    targetCategory.mots_cles = targetCategory.mots_cles || [];
    targetCategory.mots_cles.splice(event.currentIndex, 0, draggedKeyword);
  }

  sendResponse(){
    if (this.hasUnclassifiedKeywords()) {
      this.toastr.warning("Merci de classer tous les mots-clés avant d'envoyer votre réponse.", "Mots-clés non classés");
      return;
    }
    let reponse = new Reponse();
    reponse.question = this.afom.questions![0];
    reponse.question.indications="Sans indicateur";
    reponse.valeur_reponse = this.noResponse;
    reponse.mots_cles = this.motsClesReponse;
    reponse.acteur = new Acteur();
    reponse.acteur.id_acteur = this.id_acteur;
    this.reponses[this.reponses.length-1]=reponse;
    this.createReponse(reponse.question.id_question);
    

  }
  ngOnDestroy(): void {
    this.forkSub?.unsubscribe();
  }
}
