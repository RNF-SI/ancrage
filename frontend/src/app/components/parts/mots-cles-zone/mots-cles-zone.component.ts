import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CdkDragDrop, CdkDragEnd, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { Observable, startWith, map, forkJoin, Subscription, finalize } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { MotCleService } from '@app/services/mot-cle.service';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { LoadingSpinnerComponent } from '@app/home-rnf/components/loading-spinner/loading-spinner.component';


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
        MatProgressSpinnerModule,
        FontAwesomeModule,
        LoadingSpinnerComponent
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

  getConnectedDropLists(cat: Nomenclature): string[] {
    const listId = `dropList-${cat.id_nomenclature}`;
    if (this.modeAnalyse()) {
      return [listId];
    }
    return this.connectedDropListsIds();
  }

  private findCategoryByDropListId(dropListId: string): Nomenclature | undefined {
    const id = Number(dropListId.replace('dropList-', ''));
    if (!id) return undefined;
    return this.categories().find(c => c.id_nomenclature === id);
  }

  private isCrossCategoryDrop(event: CdkDragDrop<MotCle[] | undefined>, targetCategory: Nomenclature): boolean {
    const sourceCategory = this.findCategoryByDropListId(event.previousContainer.id);
    return sourceCategory?.id_nomenclature !== targetCategory.id_nomenclature;
  }
  allKeywords = signal<string[]>([]);
  motsClesReponse = signal<MotCle[]>([]);
  motsCleAnalyse = signal<MotCle[]>([]);
  results = signal<GraphMotsCles[]>([]);
  disable = signal<boolean>(true);
  readonly isLoading = signal(true);
  readonly isSavingAfom = signal(false);
  readonly draggingKeywordId = signal<number | null>(null);
  readonly mergeTargetId = signal<number | null>(null);
  private ctrlPressedDuringDrag = false;
  //modeAnalyse : utilisé dans la partie générale ; !modeAnalyse: utilisé au niveau de l'entretien

  constructor() {
    effect(() => {
      const diag = this.diagnostic();
      if (this.modeAnalyse() && diag.id_diagnostic > 0) {
        this.isLoading.set(true);
        this.forkSub?.unsubscribe();
        this.getDataAnalysis();
      }
    });
    effect(() => {
      if (this.modeAnalyse()) return;

      const user = this.authService.getCurrentUser();
      this.id_role.set(user.id_role);

      const diagId = this.diagnostic().id_diagnostic;
      const idActeur = this.id_acteur();
      if (!diagId || !idActeur) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      this.forkSub?.unsubscribe();
      this.forkSub = forkJoin([
        this.motCleService.getAllByDiag(diagId),
        this.nomenclatureService.getAllByType('AFOM'),
        this.motCleService.getKeywordsByActor(idActeur),
        this.questionService.get('Atouts - Faiblesses - Opportunités - Menaces')
      ]).subscribe({
        next: ([keywords, sections, keywordsActor, questionAfom]) => {
          this.prepareData(keywords, sections, keywordsActor, questionAfom);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des mots-clés');
          this.isLoading.set(false);
        }
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
      this.forkSub = forkJoin([results$, sections$]).subscribe({
        next: ([results, sections]) => {
          this.categories.set(sections);
          for (const cat of this.categories()) {
            cat.mots_cles = [];
          }

          this.motsCleAnalyse.set([]);
          this.prepareResults(results);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des mots-clés');
          this.isLoading.set(false);
        }
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
    if(!this.modeAnalyse()){
      this.motsClesReponse.set(this.motsClesReponse().filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      ));
      
    }else{
      this.motsCleAnalyse.set(this.motsCleAnalyse().filter(mc =>
        mc.id_mot_cle !== keyword.id_mot_cle 
      ));
      
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

  onKeywordDragStarted(keyword: MotCle): void {
    this.draggingKeywordId.set(keyword.id_mot_cle);
    this.mergeTargetId.set(null);
    this.ctrlPressedDuringDrag = false;
    document.addEventListener('keydown', this.onDocumentKeyDown);
    document.addEventListener('keyup', this.onDocumentKeyUp);
  }

  onKeywordDragMoved(event: CdkDragMove<MotCle>): void {
    const pointerEvent = event.event as MouseEvent;
    if (pointerEvent.ctrlKey) {
      this.ctrlPressedDuringDrag = true;
    }

    if (!this.isCtrlMergeActive(pointerEvent)) {
      this.mergeTargetId.set(null);
      return;
    }

    const draggedId = this.draggingKeywordId();
    if (draggedId === null) {
      return;
    }

    const dragged = this.findKeywordById(draggedId);
    const { x, y } = event.pointerPosition;
    const chipEl = document.elementFromPoint(x, y)?.closest('[data-mot-cle-id]') as HTMLElement | null;
    if (!chipEl || !dragged) {
      this.mergeTargetId.set(null);
      return;
    }

    const targetId = Number(chipEl.getAttribute('data-mot-cle-id'));
    const target = this.findKeywordById(targetId);
    if (!target || !this.canMergeWith(dragged, target)) {
      this.mergeTargetId.set(null);
      return;
    }

    this.mergeTargetId.set(targetId);
  }

  onKeywordDragEnded(_event: CdkDragEnd): void {
    this.tryMergeDraggedKeyword();
    this.clearDragMergeState();
  }

  private tryMergeDraggedKeyword(): boolean {
    const draggedId = this.draggingKeywordId();
    const targetId = this.mergeTargetId();
    if (!draggedId || !targetId) {
      return false;
    }

    const dragged = this.findKeywordById(draggedId);
    const target = this.findKeywordById(targetId);
    if (!dragged || !target || !this.canMergeWith(dragged, target)) {
      return false;
    }

    this.mergeKeywords(dragged, target);
    return true;
  }

  isMergeTarget(keyword: MotCle): boolean {
    return this.mergeTargetId() === keyword.id_mot_cle;
  }

  private onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Control') {
      this.ctrlPressedDuringDrag = true;
    }
  };

  private onDocumentKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Control') {
      this.ctrlPressedDuringDrag = false;
    }
  };

  private clearDragMergeState(): void {
    this.draggingKeywordId.set(null);
    this.mergeTargetId.set(null);
    this.ctrlPressedDuringDrag = false;
    document.removeEventListener('keydown', this.onDocumentKeyDown);
    document.removeEventListener('keyup', this.onDocumentKeyUp);
  }

  private isCtrlMergeActive(event?: MouseEvent): boolean {
    return this.ctrlPressedDuringDrag || !!event?.ctrlKey;
  }

  private findKeywordById(id: number): MotCle | undefined {
    for (const cat of this.categories()) {
      const found = cat.mots_cles?.find(k => k.id_mot_cle === id);
      if (found) {
        return found;
      }
    }
    return this.motsClesReponse().find(k => k.id_mot_cle === id)
      ?? this.motsCleAnalyse().find(k => k.id_mot_cle === id);
  }

  private canMergeWith(dragged: MotCle, target: MotCle): boolean {
    if (dragged.id_mot_cle === target.id_mot_cle) {
      return false;
    }
    if (
      this.modeAnalyse() &&
      dragged.categorie?.id_nomenclature !== target.categorie?.id_nomenclature
    ) {
      return false;
    }
    return true;
  }

  drop(event: CdkDragDrop<MotCle[] | undefined>, targetCategory: Nomenclature): void {
    const pointerEvent = event.event as MouseEvent | PointerEvent;
    const isCtrlPressed = pointerEvent?.ctrlKey || this.ctrlPressedDuringDrag;

    // Fusion CTRL : gérée dans onKeywordDragEnded (drop ignoré si tri désactivé)
    if (isCtrlPressed) {
      return;
    }

    this.clearDragMergeState();
    const draggedKeyword: MotCle = event.previousContainer.data?.[event.previousIndex]!;
    if (!draggedKeyword) return;

    if (this.modeAnalyse() && this.isCrossCategoryDrop(event, targetCategory)) {
      return;
    }
  
    const isShiftPressed = pointerEvent?.shiftKey;

    if (this.modeAnalyse() && isShiftPressed) {
      return;
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
        width: 'min(50vw, 520px)',
        minWidth: '420px',
        minHeight: '320px',
        data: {
          keyword: keyword,
          listeMotsCles: listToSend,
          sections: this.categories()
        }
      });
      dialogRef.afterClosed().subscribe(listeMC => {
        if (listeMC && this.modeAnalyse()) {
          this.setKeywords(listeMC);
        }
      });
    }
  }

  trackByMotCleId(index: number, item: MotCle): number {
    return item.id_mot_cle;
  }

  sendResponse(){
    if (this.isSavingAfom()) {
      return;
    }
    if (this.hasUnclassifiedKeywords()) {
      this.toastr.warning("Merci de classer tous les mots-clés avant d'envoyer votre réponse.", "Mots-clés non classés");
      return;
    }
    if (!this.modeAnalyse()){
      // Sauvegarder les données locales pour les conserver pendant l'envoi
      const motsClesLocaux = [...this.motsClesReponse()];
      const categoriesLocales = this.categories().map(cat => {
        const newCat = new Nomenclature();
        Object.assign(newCat, cat);
        newCat.mots_cles = [...(cat.mots_cles || [])];
        return newCat;
      });
      
      let reponse = new Reponse();
      reponse.question = this.questionAfom();
      reponse.question!.indications="Sans indicateur";
      reponse.valeur_reponse = this.noResponse();
      // Créer une copie profonde pour éviter de modifier les objets originaux
      reponse.mots_cles = this.motsClesReponse().map(mc => {
        const mcCopy = new MotCle();
        Object.assign(mcCopy, mc);
        mcCopy.categorie = new Nomenclature();
        Object.assign(mcCopy.categorie, mc.categorie);
        mcCopy.categorie.mots_cles = [];
        return mcCopy;
      });
      reponse.acteur = new Acteur();
      reponse.acteur.id_acteur = this.id_acteur();
      
      this.isSavingAfom.set(true);
      this.reponseSub = this.reponseService.updateAfom(reponse).pipe(
        finalize(() => this.isSavingAfom.set(false))
      ).subscribe({
        next: (keywords) => {
          if (keywords.length > 0) {
            this.toastr.success("Données enregistrées");
            this.setKeywords(keywords);
          } else {
            this.toastr.success("Les données ont bien été effacées.");
            this.setKeywords([]);
          }
        },
        error: () => {
          this.toastr.error("Erreur lors de l'enregistrement. Les données n'ont pas été modifiées.");
          this.categories.set(categoriesLocales);
          this.motsClesReponse.set(motsClesLocaux);
        }
      });

    }else{
      // Sauvegarder les données locales pour les conserver pendant l'envoi
      const motsClesAnalyseLocaux = [...this.motsCleAnalyse()];
      const categoriesLocales = this.categories().map(cat => {
        const newCat = new Nomenclature();
        Object.assign(newCat, cat);
        newCat.mots_cles = [...(cat.mots_cles || [])];
        return newCat;
      });
      
      let afoms:GraphMotsCles[]=[];
      for (const mc of this.motsCleAnalyse()){
        // Créer une copie pour éviter de modifier l'original
        const mcCopy = new MotCle();
        Object.assign(mcCopy, mc);
        mcCopy.categorie = new Nomenclature();
        Object.assign(mcCopy.categorie, mc.categorie);
        mcCopy.categorie.mots_cles = [];
        
        let afom = new GraphMotsCles();
        afom.id_afom = mc.afom_id!;
        afom.mot_cle = mcCopy;
        for( let kw of mc.mots_cles_issus){
          kw.categorie.mots_cles = [];
          kw.mots_cles_issus = [];
        }
        afom.mot_cle.categorie.mots_cles = []
        afom.mot_cle.diagnostic.id_diagnostic = this.id_diagnostic();
        afom.nombre = mc.nombre!;
        afoms.push(afom);
      }
      this.diagSub = this.diagnosticService.updateAfom(afoms).subscribe({
        next: (afoms) => {
          if (afoms.length > 0) {
            this.toastr.success("Données enregistrées");
            this.prepareResults(afoms);
          } else {
            this.toastr.success("Les données ont bien été effacées.");
            this.setKeywords([]);
          }
        },
        error: (error) => {
          // En cas d'erreur, restaurer les données locales
          this.toastr.error("Erreur lors de l'enregistrement. Les données n'ont pas été modifiées.");
          this.categories.set(categoriesLocales);
          this.motsCleAnalyse.set(motsClesAnalyseLocaux);
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
    if (
      this.modeAnalyse() &&
      source.categorie?.id_nomenclature !== target.categorie?.id_nomenclature
    ) {
      return;
    }

    if (!this.isGroup(source) && !this.isGroup(target)) {
      let listToSend:MotCle[]=[];
     
      if(this.modeAnalyse()){
        listToSend = this.motsCleAnalyse();
      }else{
        listToSend = this.motsClesReponse();
      }

      const dialogRef = this.dialog.open(AlerteGroupeMotsClesComponent, {
        disableClose: true,
        width: 'min(50vw, 520px)',
        minWidth: '420px',
        minHeight: '320px',
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
    this.clearDragMergeState();
    this.forkSub?.unsubscribe();
    this.diagSub?.unsubscribe();
    this.reponseSub?.unsubscribe();
  }
}
