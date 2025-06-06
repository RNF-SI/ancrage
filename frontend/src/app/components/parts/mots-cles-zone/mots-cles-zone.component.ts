import { AfterViewInit, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { AlerteGroupeMotsClesComponent } from '@app/components/alertes/alerte-groupe-mots-cles/alerte-groupe-mots-cles.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlerteMotsClesComponent } from '@app/components/alertes/alerte-mots-cles/alerte-mots-cles.component';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { GraphMotsCles } from '@app/models/graph-mots-cles';

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
    FontAwesomeModule
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
  dialog = inject(MatDialog);
  private tempIdCounter = -1;
  @Input() modeAnalyse=false;
  private diagnosticService = inject(DiagnosticService);
  results:GraphMotsCles[]=[];
  motsCleAnalyse:MotCle[]=[]
  @Input() id_diagnostic=0;
  private diagSub?:Subscription;

  ngAfterViewInit(): void {
    
    if(!this.modeAnalyse){
      const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
      const keywordsDiag$ = this.motCleService.getAllByDiag(this.diagnostic.id_diagnostic);
      const keywordsActor$ = this.motCleService.getKeywordsByActor(this.id_acteur);
    
      this.forkSub = forkJoin([keywordsDiag$, sections$, keywordsActor$]).subscribe(([keywords, sections, keywordsActor]) => {
        this.categories = sections;
        this.connectedDropListsIds = this.categories.map(c => `dropList-${c.id_nomenclature}`);
        
        // ⚠️ Important : vider les mots_cles de chaque catégorie proprement
        for (const cat of this.categories) {
          cat.mots_cles = [];
        }
    
        this.motsClesReponse = [];
        if (keywords.length > 0) {
          for (const k of keywords) {
            this.allKeywords.push(k.nom);
          }
        }
    
        this.setKeywords(keywordsActor);
      });
    }
   
  }

  getDataAnalysis(){
    const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
    const results$ = this.diagnosticService.getOccurencesKeyWords(this.id_diagnostic);
      this.forkSub = forkJoin([results$, sections$]).subscribe(([results, sections]) => {
        this.categories = sections;
        this.connectedDropListsIds = this.categories.map(c => `dropList-${c.id_nomenclature}`);
        // ⚠️ Important : vider les mots_cles de chaque catégorie proprement
        for (const cat of this.categories) {
          cat.mots_cles = [];
        }
    
        this.motsClesReponse = [];
        this.prepareResults(results);
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
      if (changes['id_diagnostic'] && this.id_diagnostic>0 && this.modeAnalyse) {
        this.getDataAnalysis();
      }
      
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
    if(!this.modeAnalyse){
      this.motsClesReponse = this.motsClesReponse.filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      );
    }else{
      this.motsCleAnalyse = this.motsCleAnalyse.filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      );
    }
    
    console.log(this.motsClesReponse);

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
      const mot_cle: MotCle = new MotCle();
      mot_cle.nom = kw;
      mot_cle.categories = [nonClasse];
      mot_cle.diagnostic = this.diagnostic;
      if(this.modeAnalyse){
        mot_cle.nombre=1;
      }
      // ✅ ID temporaire négatif (évite collision avec des IDs réels positifs)
      mot_cle.id_mot_cle = this.generateTempId();
      nonClasse.mots_cles?.push(mot_cle);
      this.motsClesReponse.push(mot_cle);
      this.allKeywords.push(mot_cle.nom);
    }
  
    this.inputCtrl.setValue('');
  }

  private generateTempId(): number {
    return this.tempIdCounter--;
  }

  private _filter(value: string): string[] {
    const allUsedKeywords = this.categories.flatMap(cat => cat.mots_cles?.map(k => k.nom) || []);
    return this.allKeywords.filter(option =>
      option.toLowerCase().includes(value.toLowerCase()) &&
      !allUsedKeywords.includes(option)
    );
  }

  drop(event: CdkDragDrop<MotCle[] | undefined>, targetCategory: Nomenclature): void {
    const draggedKeyword: MotCle = event.previousContainer.data?.[event.previousIndex]!;
    if (!draggedKeyword) return;
  
    const isShiftPressed = (event.event as MouseEvent | PointerEvent)?.shiftKey;
    const isCtrlPressed = (event.event as MouseEvent | PointerEvent)?.ctrlKey;
  
    if (isCtrlPressed) {
      const targetKeyword = event.container.data?.[event.currentIndex];
      if (targetKeyword && targetKeyword.id_mot_cle !== draggedKeyword.id_mot_cle) {
        this.mergeKeywords(draggedKeyword, targetKeyword);
        return;
      }
    }
  
    if (!isShiftPressed) {

      for (const cat of this.categories) {
        if (cat.mots_cles) {
          cat.mots_cles = cat.mots_cles.filter(k => k.id_mot_cle !== draggedKeyword.id_mot_cle);
        }
      }

      draggedKeyword.categories = [targetCategory];
    } else {

      const alreadyIn = draggedKeyword.categories.some(c => c.id_nomenclature === targetCategory.id_nomenclature);
      if (!alreadyIn) {
        draggedKeyword.categories.push(targetCategory);
      }
    }
  
    targetCategory.mots_cles = targetCategory.mots_cles || [];
    const alreadyThere = targetCategory.mots_cles.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle);
    if (!alreadyThere) {
      targetCategory.mots_cles.push(draggedKeyword);
    }
    if(!this.modeAnalyse){
      if (!this.motsClesReponse.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
        this.motsClesReponse.push(draggedKeyword);
      }
    }else{
      if (!this.motsCleAnalyse.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
        this.motsCleAnalyse.push(draggedKeyword);
      }
    }
    
  }

  checkKeywords(keyword:MotCle){
    if(keyword.mots_cles_issus!.length > 0){
      this.dialog.open(AlerteMotsClesComponent, {
        data: {
          keyword:keyword
        }
      });
    }
  }

  trackByMotCleId(index: number, item: MotCle): number {
    return item.id_mot_cle;
  }

  sendResponse(){
    if (this.hasUnclassifiedKeywords()) {
      this.toastr.warning("Merci de classer tous les mots-clés avant d'envoyer votre réponse.", "Mots-clés non classés");
      return;
    }
    if (!this.modeAnalyse){
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
    
      this.reponses[this.reponses.length-1]=reponse;
      this.createReponse(reponse.question!.id_question);
    }else{
      let afoms:GraphMotsCles[]=[];
      for (const mc of this.motsCleAnalyse){
        for (let i=0;i<mc.categories.length;i++){
          mc.categories[i].mots_cles = [];
        
        }
        let afom = new GraphMotsCles();
        afom.id_afom = mc.afom_id!;
        afom.mot_cle = mc;
        afom.mot_cle.diagnostic.id_diagnostic = this.id_diagnostic
        afom.nombre = mc.nombre!;
        console.log(afom);
        afoms.push(afom);
      }
      this.diagSub = this.diagnosticService.updateAfom(afoms).subscribe(afoms=>{
        console.log(afoms);
        this.prepareResults(afoms);
      });
    }
    
  }

  prepareResults(results:GraphMotsCles[]){
    this.motsCleAnalyse=[];
    let cpt=0;
    for (const res of results) {
      const mot_cle = res.mot_cle;
      mot_cle.nombre = res.nombre; 
      mot_cle.afom_id = res.id_afom;
    
      this.motsCleAnalyse.push(res.mot_cle);
      cpt++;
    }
    
    this.setKeywords(this.motsCleAnalyse);

  }

  setKeywords(keywords:MotCle[]): void {
    for (const cat of this.categories) {
      cat.mots_cles = [];
    }
  
    this.motsClesReponse = [];
    this.motsCleAnalyse = []
    for (const mc of keywords) {

      if (mc.mot_cle_id_groupe !== null && mc.mot_cle_id_groupe !== undefined) {
        continue;
      }
  
      mc.diagnostic = new Diagnostic();
      mc.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
  
      for (const catRef of mc.categories || []) {
        
        const matchingCat = this.categories.find(c => c.id_nomenclature === catRef.id_nomenclature);
        
        if (matchingCat) {
          matchingCat.mots_cles = matchingCat.mots_cles || [];
  
          if (!matchingCat.mots_cles.some(k => k.id_mot_cle === mc.id_mot_cle)) {
            matchingCat.mots_cles.push(mc);
          }
        }
      }
      if (!this.modeAnalyse){
        if (!this.motsClesReponse.some(k => k.id_mot_cle === mc.id_mot_cle)) {
          this.motsClesReponse.push(mc);
        }
      }else{
        if (!this.motsCleAnalyse.some(k => k.id_mot_cle === mc.id_mot_cle)) {
          this.motsCleAnalyse.push(mc);
        }
      }
     

    }
  }

  getVisibleKeywords(cat: Nomenclature): MotCle[] {
    return (cat.mots_cles || []).filter(k => !k.mot_cle_id_groupe);
  }

  mergeKeywords(source: MotCle, target: MotCle): void {

    if (!this.isGroup(source) && !this.isGroup(target)) {
      const dialogRef = this.dialog.open(AlerteGroupeMotsClesComponent, {
        data: {
          source: source,
          target: target,
          diagnostic: this.diagnostic,
          motsClesReponse: this.motsClesReponse,
          categories: this.categories
        }
      });
  
      dialogRef.afterClosed().subscribe(updatedMotsCles => {
        if (updatedMotsCles) {
          if (this.modeAnalyse){
            this
          }
          this.setKeywords(updatedMotsCles);
        }
      });
  
    // Cas 2 : target est un groupe, on ajoute source dedans
    } else if (!this.isGroup(source) && this.isGroup(target)) {
      

      const alreadyInGroup = target.mots_cles_issus?.some(mc => mc.id_mot_cle === source.id_mot_cle);
      if (!alreadyInGroup) {
        source.mot_cle_id_groupe = target.id_mot_cle;
        target.mots_cles_issus!.push(source);

        this.motsClesReponse = this.motsClesReponse.filter(mc =>
          mc.id_mot_cle !== source.id_mot_cle 
        );
        if(source.nombre && target.nombre){
          target.nombre += source.nombre;
        }
        this.setKeywords(this.motsClesReponse);
 
        source.mot_cle_id_groupe = target.id_mot_cle;
      }
    }
  }
  
  isGroup(motCle: MotCle): boolean {
    return motCle.mots_cles_issus?.length! > 0;
  }

  ngOnDestroy(): void {
    this.forkSub?.unsubscribe();
  }
}
