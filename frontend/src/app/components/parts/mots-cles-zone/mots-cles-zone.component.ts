import { AfterViewInit, Component, inject, Input, OnDestroy, SimpleChanges } from '@angular/core';
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
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { ReponseService } from '@app/services/reponse.service';
import { Question } from '@app/models/question.model';
import { QuestionService } from '@app/services/question.service';


@Component({
    selector: 'app-mots-cles-zone',
    templateUrl: './mots-cles-zone.component.html',
    styleUrls: ['./mots-cles-zone.component.scss'],
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
  private authService = inject(AuthService);
  id_role:number = 0;
  private reponseSub?:Subscription;
  private reponseService = inject(ReponseService);
  private questionService = inject(QuestionService);
  questionAfom = new Question();

  //modeAnalyse : utilisé dans la partie générale ; !modeAnalyse: utilisé au niveau de l'entretien

  ngAfterViewInit(): void {
    if (!this.modeAnalyse) {
      setTimeout(() => {
        const user = this.authService.getCurrentUser();
        this.id_role = user.id_role;
  
        const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
        const keywordsDiag$ = this.motCleService.getAllByDiag(this.diagnostic.id_diagnostic);
        const keywordsActor$ = this.motCleService.getKeywordsByActor(this.id_acteur);
        const questionAfom$ = this.questionService.get("Atouts - Faiblesses - Opportunités - Menaces");
  
        this.forkSub = forkJoin([keywordsDiag$, sections$, keywordsActor$, questionAfom$]).subscribe(([keywords, sections, keywordsActor, questionAfom]) => {
          this.prepareData(keywords, sections, keywordsActor, questionAfom);
          
        });
      });
    }
  }

  prepareData(keywords:MotCle[],sections:Nomenclature[],keywordsActor:MotCle[],questionAfom:Question){
    this.questionAfom = questionAfom;
    this.categories = sections;
    this.connectedDropListsIds = this.categories.map(c => `dropList-${c.id_nomenclature}`);
    for (const cat of this.categories) {
      cat.mots_cles = [];
    }

    this.motsClesReponse = [];
    this.allKeywords = [];
    if (keywords.length > 0) {
      for (const k of keywords) {
        if (!this.allKeywords.includes(k.nom)){
          this.allKeywords.push(k.nom);
        }
        
      }
    }

    this.setKeywords(keywordsActor);
  }

  getDataAnalysis(){
    let user = this.authService.getCurrentUser();
    this.id_role = user.id_role;
    const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
    const results$ = this.diagnosticService.getOccurencesKeyWords(this.diagnostic.id_diagnostic);
      this.forkSub = forkJoin([results$, sections$]).subscribe(([results, sections]) => {
        this.categories = sections;
        this.connectedDropListsIds = this.categories.map(c => `dropList-${c.id_nomenclature}`);
        for (const cat of this.categories) {
          cat.mots_cles = [];
        }
    
        this.motsCleAnalyse = [];
        this.prepareResults(results);
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
      if (changes['diagnostic'] && this.modeAnalyse) {
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
      mot_cle.categorie = nonClasse;
      mot_cle.diagnostic = this.diagnostic;
      if(this.modeAnalyse){
        mot_cle.nombre=1;
      }
      // ✅ ID temporaire négatif (évite collision avec des IDs réels positifs)
      mot_cle.id_mot_cle = this.generateTempId();
      nonClasse.mots_cles?.push(mot_cle);
      if(this.modeAnalyse){
        this.motsCleAnalyse.push(mot_cle);
      }else{
        this.motsClesReponse.push(mot_cle);
      }
      
      if (!this.allKeywords.includes(mot_cle.nom)){
        this.allKeywords.push(mot_cle.nom);
      }
      
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
      // Déplacement classique
      for (const cat of this.categories) {
        if (cat.mots_cles) {
          cat.mots_cles = cat.mots_cles.filter(k => k.id_mot_cle !== draggedKeyword.id_mot_cle);
        }
      }
  
      draggedKeyword.categorie = targetCategory;
  
      // Ajout au tableau cible
      targetCategory.mots_cles = targetCategory.mots_cles || [];
      const alreadyThere = targetCategory.mots_cles.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle);
      if (!alreadyThere) {
        targetCategory.mots_cles.push(draggedKeyword);
      }
  
      if (!this.modeAnalyse) {
        if (!this.motsClesReponse.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
          this.motsClesReponse.push(draggedKeyword);
        }
      } else {
        if (!this.motsCleAnalyse.some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
          this.motsCleAnalyse.push(draggedKeyword);
        }

      }
  
    } else {
      // Duplication avec MAJ
      const alreadyInSameCategory = draggedKeyword.categorie.id_nomenclature === targetCategory.id_nomenclature;
  
      if (!alreadyInSameCategory) {
       
        const newKeyword = new MotCle();
        newKeyword.nom = draggedKeyword.nom;
        newKeyword.categorie = targetCategory;
        newKeyword.diagnostic = this.diagnostic;
        // Ajout à la catégorie cible
        targetCategory.mots_cles = targetCategory.mots_cles || [];
        targetCategory.mots_cles.push(newKeyword);
  
        if (!this.modeAnalyse) {
          this.motsClesReponse.push(newKeyword);
        } else {
          this.motsCleAnalyse.push(newKeyword);
        }
      }
    }
  }

  checkKeywords(keyword:MotCle){
    if(keyword.mots_cles_issus!.length > 0){
      let listToSend:MotCle[] = [];
      if(this.modeAnalyse){
        listToSend = this.motsCleAnalyse;
      }else{
        listToSend = this.motsClesReponse;
      }
 
      const dialogRef = this.dialog.open(AlerteMotsClesComponent, {
        data: {
          keyword:keyword,
          listeMotsCles:listToSend,
          sections:this.categories
        }
      });
      dialogRef.afterClosed().subscribe(listeMC=>{
        if(this.modeAnalyse){
          this.setKeywords(listeMC);
        }
      })
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
      reponse.question = this.questionAfom;
      reponse.question!.indications="Sans indicateur";
      reponse.valeur_reponse = this.noResponse;
      reponse.mots_cles = this.motsClesReponse;
      reponse.acteur = new Acteur();
      reponse.acteur.id_acteur = this.id_acteur;
      for (let i=0;i<reponse.mots_cles.length;i++){
        
          reponse.mots_cles[i].categorie.mots_cles=[];
      }
   
      this.reponseSub = this.reponseService.updateAfom(reponse).subscribe(keywords=>{
        this.setKeywords(keywords);
      })

    }else{
      let afoms:GraphMotsCles[]=[];
      for (const mc of this.motsCleAnalyse){
        mc.categorie.mots_cles=[];
        let afom = new GraphMotsCles();
        afom.id_afom = mc.afom_id!;
        afom.mot_cle = mc;
        afom.mot_cle.diagnostic.id_diagnostic = this.id_diagnostic
        afom.nombre = mc.nombre!;
        afoms.push(afom);
      }
      this.diagSub = this.diagnosticService.updateAfom(afoms).subscribe(afoms=>{
       
        this.prepareResults(afoms);
      });
    }
    
  }

  prepareResults(results:GraphMotsCles[]){

    this.motsCleAnalyse=[];
    let ids_array:number[]=[]
    for (const res of results) {
      if (res.mot_cle.mots_cles_issus.length > 0){
        const mot_cle = res.mot_cle;
        mot_cle.nombre = res.nombre; 
        for (const mc of res.mot_cle.mots_cles_issus){
          ids_array.push(mc.id_mot_cle);
          
        }
        mot_cle.afom_id = res.id_afom;
      
        this.motsCleAnalyse.push(res.mot_cle);
      
        

      }else{
        const mot_cle = res.mot_cle;
        mot_cle.nombre = res.nombre; 
        mot_cle.afom_id = res.id_afom;
      
        this.motsCleAnalyse.push(res.mot_cle);
     
        
      }
     
    }

    for(let i=0;i<this.motsCleAnalyse.length;i++){
      for (let j=0;j<ids_array.length;j++){
        if (this.motsCleAnalyse[i].id_mot_cle == ids_array[j]){
          this.motsCleAnalyse.splice(i,1);
          break;
        }
      }
      
    }

    this.setKeywords(this.motsCleAnalyse);

  }

  setKeywords(keywords: MotCle[]): void {
    // Réinitialise les mots-clés associés à chaque catégorie
    for (const cat of this.categories) {
      cat.mots_cles = [];
    }
  
    this.motsClesReponse = [];
    this.motsCleAnalyse = [];
  
    for (const mc of keywords) {
  
      // Sauter les mots-clés qui sont des enfants (issus d’un groupe)
      if (mc.mot_cle_id_groupe !== null && mc.mot_cle_id_groupe !== undefined) {
        continue;
      }
  
      // Rattache le diagnostic actuel (utile si nécessaire pour l'affichage ou l’édition)
      mc.diagnostic = new Diagnostic();
      mc.diagnostic.id_diagnostic = this.diagnostic.id_diagnostic;
    
      // Utilise la seule catégorie associée (mc.categorie)
      if (mc.categorie && mc.categorie.id_nomenclature) {
        const matchingCat = this.categories.find(c => c.id_nomenclature === mc.categorie.id_nomenclature);

        if (matchingCat) {
          matchingCat.mots_cles = matchingCat.mots_cles || [];
  
          if (mc.id_mot_cle == 0 || !matchingCat.mots_cles.some(k => k.id_mot_cle === mc.id_mot_cle)) {
            matchingCat.mots_cles.push(mc);
          }
        }
      }

      // Ajoute le mot-clé soit dans la liste des réponses, soit dans celle d’analyse
      if (!this.modeAnalyse) {
        if (mc.id_mot_cle == 0 || !this.motsClesReponse.some(k => k.id_mot_cle === mc.id_mot_cle)) {
          this.motsClesReponse.push(mc);
        }
      } else {
        if (mc.id_mot_cle == 0 || !this.motsCleAnalyse.some(k => k.id_mot_cle === mc.id_mot_cle)) {
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
      let listToSend:MotCle[]=[];
     
      if(this.modeAnalyse){
        listToSend = this.motsCleAnalyse;
      }else{
        listToSend = this.motsClesReponse;
      }

      const dialogRef = this.dialog.open(AlerteGroupeMotsClesComponent, {
        disableClose: true,
        data: {
          source: source,
          target: target,
          diagnostic: this.diagnostic,
          motsClesReponse: listToSend,
          categories: this.categories
        }
      });
  
      dialogRef.afterClosed().subscribe(updatedMotsCles => {
        if (updatedMotsCles) {
          this.setKeywords(updatedMotsCles);
        }
      });
  
    // Cas 2 : target est un groupe, on ajoute source dedans
    } else if (!this.isGroup(source) && this.isGroup(target)) {
      

      const alreadyInGroup = target.mots_cles_issus?.some(mc => mc.id_mot_cle === source.id_mot_cle);
      if (!alreadyInGroup) {
        source.mot_cle_id_groupe = target.id_mot_cle;
        target.mots_cles_issus!.push(source);

        if(source.nombre && target.nombre){
          target.nombre += source.nombre;
        }
        
        if (!this.modeAnalyse){
          this.motsClesReponse = this.motsClesReponse.filter(mc =>
            mc.id_mot_cle !== source.id_mot_cle 
          );
          this.setKeywords(this.motsClesReponse);
        }else{
          this.motsCleAnalyse = this.motsCleAnalyse.filter(mc =>
            mc.id_mot_cle !== source.id_mot_cle 
          );
          this.setKeywords(this.motsCleAnalyse);
        }
 
        source.mot_cle_id_groupe = target.id_mot_cle;
      }
    }
  }
  
  isGroup(motCle: MotCle): boolean {
    return motCle.mots_cles_issus?.length! > 0;
  }

  ngOnDestroy(): void {
    this.forkSub?.unsubscribe();
    this.diagSub?.unsubscribe();
    this.reponseSub?.unsubscribe();
  }
}
