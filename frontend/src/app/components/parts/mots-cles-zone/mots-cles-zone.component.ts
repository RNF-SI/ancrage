import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
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
export class MotsClesZoneComponent implements OnDestroy{
  
  keywords: string[] = [];
  inputCtrl = new FormControl('');
  separatorKeys = [ENTER, COMMA];
  diagnostic = input<Diagnostic>(new Diagnostic());
  id_acteur = input<number>(0);
  noResponse = input<Nomenclature>(new Nomenclature());
  reponses = input<Reponse[]>([]);
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
  modeAnalyse = input<boolean>(false);
  private diagnosticService = inject(DiagnosticService);
  id_diagnostic = input<number>(0);
  private diagSub?:Subscription;
  private authService = inject(AuthService);
  id_role = signal<number>(0);
  private reponseSub?:Subscription;
  private reponseService = inject(ReponseService);
  private questionService = inject(QuestionService);
  questionAfom = signal<Question>(new Question());
  categories = signal<Nomenclature[]>([]);
  connectedDropListsIds = computed(() =>
    this.categories().map(c => `dropList-${c.id_nomenclature}`)
  );
  allKeywords = signal<string[]>([]);
  motsClesReponse = signal<MotCle[]>([]);
  motsCleAnalyse = signal<MotCle[]>([]);
  results = signal<GraphMotsCles[]>([]);
  disable = signal<boolean>(true);
  //modeAnalyse : utilisé dans la partie générale ; !modeAnalyse: utilisé au niveau de l'entretien

  constructor() {
    effect(() => {
      if (this.modeAnalyse() && this.diagnostic().id_diagnostic > 0) {
        this.getDataAnalysis();
      }
    });
    effect(() => {
      if (this.modeAnalyse()) return;
  
      const user = this.authService.getCurrentUser();
      this.id_role.set(user.id_role);
  
      const diagId = this.diagnostic().id_diagnostic;
      const idActeur = this.id_acteur();
  
      forkJoin([
        this.motCleService.getAllByDiag(diagId),
        this.nomenclatureService.getAllByType('AFOM'),
        this.motCleService.getKeywordsByActor(idActeur),
        this.questionService.get('Atouts - Faiblesses - Opportunités - Menaces')
      ]).subscribe({
        next: ([keywords, sections, keywordsActor, questionAfom]) => {
          this.prepareData(keywords, sections, keywordsActor, questionAfom);
        },
        error: () => this.toastr.error('Erreur lors du chargement des mots-clés')
      });
    });
  }
  

  prepareData(keywords: MotCle[], sections: Nomenclature[], keywordsActor: MotCle[], questionAfom: Question): void {
    this.questionAfom.set(questionAfom);
  
    const updatedSections = sections.map(c => {
      const n = Nomenclature.fromJson(c);
      n.mots_cles = [];
      return n;
    });
    this.categories.set(updatedSections);
  
    const allKw = new Set(this.allKeywords());
    keywords.forEach(k => allKw.add(k.nom));
    this.allKeywords.set(Array.from(allKw));
  
    this.setKeywords(keywordsActor);
  }

  getDataAnalysis(){
    let user = this.authService.getCurrentUser();
    this.id_role.set(user.id_role);
    const sections$ = this.nomenclatureService.getAllByType('AFOM'); 
    const results$ = this.diagnosticService.getOccurencesKeyWords(this.diagnostic().id_diagnostic);
      this.forkSub = forkJoin([results$, sections$]).subscribe(([results, sections]) => {
        this.categories.set(sections);
        for (const cat of this.categories()) {
          cat.mots_cles = [];
        }
    
        this.motsCleAnalyse.set([]);
        this.prepareResults(results);
      });
  }

  

  hasUnclassifiedKeywords() {
    const nonClasse = this.categories().find(c => c.libelle === "Non classés");
  
    return !!nonClasse?.mots_cles?.length;
  };

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
      this.motsClesReponse.set(this.motsClesReponse().filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      ));
      if (this.motsClesReponse().length === 0){
        this.disable.set(true);
      }
    }else{
      this.motsCleAnalyse.set(this.motsCleAnalyse().filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      ));
      if (this.motsCleAnalyse().length === 0){
        this.disable.set(true);
      }
    }

  }
  
  addKeyword(value: string): void {
    const kw = value?.trim();
    if (!kw) return;
  
    const cats = this.categories();
    const nonClasse = cats.find(c => c.libelle === "Non classés");
    if (!nonClasse) return;
  
    const keywordExists = cats.some(cat =>
      cat.mots_cles?.some(k => k.nom === kw)
    );
    if (keywordExists) return;
  
    const newMotCle = new MotCle();
    newMotCle.nom = kw;
    newMotCle.categorie = nonClasse;
    newMotCle.diagnostic = this.diagnostic();
    newMotCle.id_mot_cle = this.generateTempId();
    if (this.modeAnalyse()) newMotCle.nombre = 1;
  
    nonClasse.mots_cles ??= [];
    nonClasse.mots_cles.push(newMotCle);
  
    // Réinjecter les catégories (copie défensive)
    this.categories.set([...cats]);
  
    if (this.modeAnalyse()) {
      this.motsCleAnalyse.update(list => [...list, newMotCle]);
      this.disable.set(false);
    } else {
      this.motsClesReponse.update(list => [...list, newMotCle]);
      this.disable.set(false);
    }
  
    if (!this.allKeywords().includes(kw)) {
      this.allKeywords.update(list => [...list, kw]);
    }
  
    this.inputCtrl.setValue('');
  }

  private generateTempId(): number {
    return this.tempIdCounter--;
  }

  private _filter(value: string): string[] {
    const allUsedKeywords = this.categories().flatMap(cat => cat.mots_cles?.map(k => k.nom) || []);
    return this.allKeywords().filter(option =>
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
      for (const cat of this.categories()) {
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
  
      if (!this.modeAnalyse()) {
        if (!this.motsClesReponse().some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
          this.motsClesReponse.update(list => [...list, draggedKeyword]);
          this.disable.set(false);
        }
      } else {
        if (!this.motsCleAnalyse().some(mc => mc.id_mot_cle === draggedKeyword.id_mot_cle)) {
          this.motsCleAnalyse.update(list => [...list, draggedKeyword]);
          this.disable.set(false);
        }

      }
      console.log(this.disable());
    } else {
      // Duplication avec MAJ
      const alreadyInSameCategory = draggedKeyword.categorie.id_nomenclature === targetCategory.id_nomenclature;
  
      if (!alreadyInSameCategory) {
       
        const newKeyword = new MotCle();
        newKeyword.nom = draggedKeyword.nom;
        newKeyword.categorie = targetCategory;
        newKeyword.diagnostic = this.diagnostic();
        // Ajout à la catégorie cible
        targetCategory.mots_cles = targetCategory.mots_cles || [];
        targetCategory.mots_cles.push(newKeyword);
       
        if (!this.modeAnalyse()) {
          this.motsClesReponse.update(list => [...list, newKeyword]);
          this.disable.set(false);
        } else {
          this.motsCleAnalyse.update(list => [...list, newKeyword]);
          this.disable.set(false);
        }
        
      }
    }
  }

  checkKeywords(keyword:MotCle){
    if(keyword.mots_cles_issus!.length > 0){
      let listToSend:MotCle[] = [];
      if(this.modeAnalyse()){
        listToSend = this.motsCleAnalyse();
      }else{
        listToSend = this.motsClesReponse();
      }
 
      const dialogRef = this.dialog.open(AlerteMotsClesComponent, {
        data: {
          keyword:keyword,
          listeMotsCles:listToSend,
          sections:this.categories
        }
      });
      dialogRef.afterClosed().subscribe(listeMC=>{
        if(this.modeAnalyse()){
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
    if (!this.modeAnalyse()){
      let reponse = new Reponse();
      reponse.question = this.questionAfom();
      reponse.question!.indications="Sans indicateur";
      reponse.valeur_reponse = this.noResponse();
      reponse.mots_cles = this.motsClesReponse();
      reponse.acteur = new Acteur();
      reponse.acteur.id_acteur = this.id_acteur();
      for (let i=0;i<reponse.mots_cles.length;i++){
        
          reponse.mots_cles[i].categorie.mots_cles=[];
      }
      
      this.reponseSub = this.reponseService.updateAfom(reponse).subscribe(keywords=>{
        if (keywords.length >0 ){
          this.toastr.success("Données enregistrées");
          this.setKeywords(keywords);
        }else{
          this.toastr.error("Problème à l'enregistrement des données");
        }
        
      });

    }else{
      let afoms:GraphMotsCles[]=[];
      for (const mc of this.motsCleAnalyse()){
        mc.categorie.mots_cles=[];
        let afom = new GraphMotsCles();
        afom.id_afom = mc.afom_id!;
        afom.mot_cle = mc;
        for( let kw of mc.mots_cles_issus){
          kw.categorie.mots_cles = [];
          kw.mots_cles_issus = [];
        }
        afom.mot_cle.categorie.mots_cles = []
        afom.mot_cle.diagnostic.id_diagnostic = this.id_diagnostic();
        afom.nombre = mc.nombre!;
        afoms.push(afom);
      }
      this.diagSub = this.diagnosticService.updateAfom(afoms).subscribe(afoms=>{
        if (afoms.length >0 ){
          this.toastr.success("Données enregistrées");
          this.prepareResults(afoms);
        }else{
          this.toastr.error("Problème à l'enregistrement des données");
        }
        
      });
    }
    
  }

  prepareResults(results: GraphMotsCles[]): void {
    const newKeywords: MotCle[] = [];
    const idsIssus: number[] = [];
  
    for (const res of results) {
      const motCle = res.mot_cle;
      motCle.nombre = res.nombre;
      motCle.afom_id = res.id_afom;
  
      if (motCle.mots_cles_issus.length > 0) {
        for (const mc of motCle.mots_cles_issus) {
          idsIssus.push(mc.id_mot_cle);
        }
      }
  
      newKeywords.push(motCle);
    }
  
    // Retirer les mots-clés "issus" (enfants) de la liste
    const filtered = newKeywords.filter(k => !idsIssus.includes(k.id_mot_cle));
  
    this.setKeywords(filtered); 
  }

  setKeywords(keywords: MotCle[]): void {
    const updatedCats: Nomenclature[] = this.categories().map(cat => {
      const newCat = new Nomenclature();
      Object.assign(newCat, cat);
      newCat.mots_cles = [];
      return newCat;
    });
    const responseKeywords: MotCle[] = [];
    const analyseKeywords: MotCle[] = [];
  
    for (const mc of keywords) {
      // ignorer les sous-mots-clés liés à un groupe
      if (mc.mot_cle_id_groupe !== null && mc.mot_cle_id_groupe !== undefined) continue;
  
      // rattacher le diagnostic courant
      mc.diagnostic = new Diagnostic();
      mc.diagnostic.id_diagnostic = this.diagnostic().id_diagnostic;
  
      // affectation à la bonne catégorie
      const matchingCat = updatedCats.find(c => c.id_nomenclature === mc.categorie?.id_nomenclature);
      if (matchingCat) {
        matchingCat.mots_cles ??= [];
        if (!matchingCat.mots_cles.some(k => k.id_mot_cle === mc.id_mot_cle)) {
          matchingCat.mots_cles.push(mc);
        }
      }
  
      // affectation à la bonne liste finale
      if (!this.modeAnalyse()) {
        if (!responseKeywords.some(k => k.id_mot_cle === mc.id_mot_cle) || mc.id_mot_cle === 0) {
          responseKeywords.push(mc);
          this.motsClesReponse.set(responseKeywords);
          this.disable.set(false);
        }
      } else {

        if (!analyseKeywords.some(k => k.id_mot_cle === mc.id_mot_cle) || mc.id_mot_cle === 0) {
          analyseKeywords.push(mc);
        
          this.motsCleAnalyse.set(analyseKeywords);
          this.disable.set(false);
        }
      }
    }
  
    this.categories.set(updatedCats);
    
  }

  getVisibleKeywords(cat: Nomenclature): MotCle[] {
    return (cat.mots_cles || []).filter(k => !k.mot_cle_id_groupe);
  }

  mergeKeywords(source: MotCle, target: MotCle): void {

    if (!this.isGroup(source) && !this.isGroup(target)) {
      let listToSend:MotCle[]=[];
     
      if(this.modeAnalyse()){
        listToSend = this.motsCleAnalyse();
      }else{
        listToSend = this.motsClesReponse();
      }

      const dialogRef = this.dialog.open(AlerteGroupeMotsClesComponent, {
        disableClose: true,
        data: {
          source: source,
          target: target,
          diagnostic: this.diagnostic(),
          motsClesReponse: listToSend,
          categories: this.categories()
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
        
        if (!this.modeAnalyse()){
          this.motsClesReponse.set(this.motsClesReponse().filter(mc =>
            mc.id_mot_cle !== source.id_mot_cle 
          ));
          this.setKeywords(this.motsClesReponse());
        }else{
          this.motsCleAnalyse.set(this.motsCleAnalyse().filter(mc =>
            mc.id_mot_cle !== source.id_mot_cle 
          ));
          this.setKeywords(this.motsCleAnalyse());
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
