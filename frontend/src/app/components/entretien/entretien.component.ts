import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Nomenclature } from '@app/models/nomenclature.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { forkJoin, Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Reponse } from '@app/models/reponse.model';
import { ReponseService } from '@app/services/reponse.service';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MenuLateralComponent } from "../parts/menu-lateral/menu-lateral.component";
import { SiteService } from '@app/services/sites.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MotsClesZoneComponent } from "../parts/mots-cles-zone/mots-cles-zone.component";
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Acteur } from '@app/models/acteur.model';
import { Question } from '@app/models/question.model';
import { ToastrService } from 'ngx-toastr';
import { StateService } from '@app/services/state.service';
import { LoadingSpinnerComponent } from '@app/home-rnf/components/loading-spinner/loading-spinner.component';


//Page de la saisie de l'entretien
@Component({
    selector: 'app-entretien',
    templateUrl: './entretien.component.html',
    styleUrls: ['./entretien.component.css'],
    standalone:true,
    imports: [
      CommonModule, 
      MatRadioModule, 
      ReactiveFormsModule, 
      MatRadioModule, 
      MatButtonModule, 
      MenuLateralComponent, 
      FontAwesomeModule, 
      MotsClesZoneComponent, 
      MatTabsModule,
      LoadingSpinnerComponent
    ]
})
export class EntretienComponent implements OnDestroy{
 
  labels = new Labels();
  readonly backToActorsLabel = 'Revenir à la liste des acteurs';
  readonly activeTabIndex = signal(0);
  readonly isLoading = signal(true);
  private initSub?: Subscription;
  private lastLoadKey = '';
  title="";
  themes = signal<Nomenclature[]>([]);
  id_acteur = signal<number>(0);
  private nomenclatureSubscription?:Subscription;
  private reponsesSubscription?:Subscription;
  private nomenclatureService = inject(NomenclatureService);
  private fb = inject(FormBuilder);
  private reponseService = inject(ReponseService);
  reponses:Reponse[] = [];
  formGroup: FormGroup = this.fb.group({});
  previousPage = "";
  diagnostic:Diagnostic = new Diagnostic();
  etats = signal<Nomenclature[]>([]);
  siteService = inject(SiteService);
  slug = signal<string>("");
  noResponse = signal<Nomenclature>(new Nomenclature());
  afom = new Nomenclature();
  menu:any;
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });
  actor:Acteur = new Acteur();
  isCCG = false;
  private toaster = inject(ToastrService);
  private stateService = inject(StateService);

  constructor(){
    effect(() => {
      this.previousPage = this.stateService.getCurrentPreviousPage()!;
      this.diagnostic = this.stateService.getCurrentDiagnostic()!;
      this.actor = this.stateService.getCurrentActor();

      for (const cat of this.actor.categories!){
        if (cat.libelle === this.labels.ccgLabel){
          this.isCCG = true;
          break;
        }
      }
      const { id_acteur, slug } = this.routeParams() as Params;
      const id = Number(id_acteur);
      this.id_acteur.set(id);
      const slugValue = slug as string;
      this.title = this.labels.addInterview + ' de ' + this.actor.nom + ' '+ this.actor.prenom;
      if (!id || !slugValue) {
        this.isLoading.set(false);
        return;
      }

      const loadKey = `${id}/${slugValue}`;
      if (this.lastLoadKey === loadKey) return;

      this.lastLoadKey = loadKey;
      this.isLoading.set(true);
      this.initSub?.unsubscribe();

      const themes$ = this.nomenclatureService.getAllByType("thème_question", id);
      const etats$ = this.nomenclatureService.getAllByType("statut_entretien");
      const noResponse$ = this.nomenclatureService.getNoResponse("");

      this.initSub = forkJoin([themes$, etats$, noResponse$]).subscribe({
        next: ([themes, etats, noResponse]) => {
          this.prepareResults(themes, etats, noResponse);
          this.menu = document.getElementById("menu");
          setTimeout(() => this.display(), 0);
          this.isLoading.set(false);
        },
        error: () => {
          this.toaster.error('Erreur lors du chargement de l\'entretien.');
          this.isLoading.set(false);
        }
      });
    });
  }

  isChoixVisible(q: Question, cr: Nomenclature): boolean {
    const isSansReponse = cr.libelle === 'Réponse avec commentaire';
    const sansReponseAutorise = q.indications === "Sans indicateur" ? true : false;
    return !isSansReponse || (isSansReponse && sansReponseAutorise);
  }

  isOptionalTheme(theme: Nomenclature): boolean {
    return theme.libelle === this.labels.optionalInterviewTheme;
  }

  private isOptionalQuestion(question?: Question): boolean {
    if (!question) return false;
    return this.themes().some(
      theme => this.isOptionalTheme(theme) &&
        theme.questions?.some(q => q.id_question === question.id_question)
    );
  }

  prepareResults(themes:Nomenclature[],etats:Nomenclature[],noResponse:Nomenclature){
    this.reponses = [];
    this.themes.set(themes);
    console.log(themes);
    this.etats.set(etats);
    this.noResponse.set(noResponse);
    const controls: { [key: string]: any } = {};
    this.afom = themes[themes.length-1];
    
    this.themes().forEach(theme => {
      console.log(theme);
      theme.questions!.forEach(q => {
        controls[`question_${q.id_question}`] = this.fb.control(null);
        controls[`reponse_${q.id_question}`] = this.fb.control(null);
        if (this.id_acteur()){
            let reponse = new Reponse();
            q.reponses?.forEach(rep => {
              if (rep.acteur?.id_acteur === this.id_acteur()) {
                reponse = rep;
              }
            });
            reponse.question = q;
            reponse.acteur.id_acteur = this.id_acteur();
            this.reponses.push(reponse);
          
        }
      });
    });
  
    this.formGroup = this.fb.group(controls);
    if (this.id_acteur() > 0){
      /* Promise.resolve().then(() => { */
        console.log(this.reponses);
        this.patchForm(this.reponses);
      /* }); */
      
    }
            
  }
  //Envoie les données récupérées au formulaire
  patchForm(reponses:Reponse[]){
    for(let i = 0;i<reponses.length;i++){
      console.log(reponses[i].question?.id_question,reponses[i].valeur_reponse.id_nomenclature,reponses[i].commentaires);
      this.formGroup.get(`question_${reponses[i].question?.id_question}`)?.setValue(
        reponses[i].valeur_reponse.id_nomenclature,
        { emitEvent: false }
      );
      this.formGroup.get(`reponse_${reponses[i].question?.id_question}`)?.setValue(
        reponses[i].commentaires,
        { emitEvent: false }
      );
      setTimeout(() => {
        this.hideWarnings(reponses,i);
      }, 0);
      this.formGroup.get(`question_${reponses[i].question?.id_question}`)?.valueChanges
          .subscribe((idNomenclature: number) => {
            const cr = reponses[i].question?.choixReponses?.find(c => c.id_nomenclature === idNomenclature);
            this.createReponse(reponses[i].question?.id_question!, cr);
          }); 
    }

  }

  hideWarnings(reponses:Reponse[],iteration:number){
    const classe = ".warn_"+reponses[iteration].question?.id_question;
    const element = document.querySelector(classe);

    if (this.isOptionalQuestion(reponses[iteration].question)) {
      element?.classList.add("invisible");
      return;
    }

    if (reponses[iteration].valeur_reponse.id_nomenclature > 0){
      
      if (reponses[iteration].valeur_reponse.id_nomenclature == this.noResponse().id_nomenclature){
        element?.classList.replace("warn","warn-partial");
        if(reponses[iteration].question?.indications == "Sans indicateur"){
          element?.classList.add("invisible");
        }
      }else {
        element?.classList.add("invisible");
      }
      
    }
  }
  //Cache ou affiche le menu en fonction de l'onglet choisi
  onTabChange(event: MatTabChangeEvent) {
    this.activeTabIndex.set(event.index);
    if (event.index === 0) {
      setTimeout(() => this.display(), 0);
    }
  }

  private display(): void {
    this.menu = document.getElementById('menu');
    if (!this.menu) return;
    this.menu.classList.remove('invisible');
    this.menu.classList.add('visible');
  }
  
  //Met la liste de réponses à jour 
  createReponse = (id_question: number, cr?: Nomenclature) => {
    const reponse = this.reponses.find(r => r.question?.id_question === id_question)!;
    if (!reponse) return;

    if (cr !== undefined) {
      reponse.valeur_reponse = cr;
    } else {
      const idNomenclature = this.formGroup.get(`question_${id_question}`)?.value;
      const choix = reponse.question?.choixReponses?.find(c => c.id_nomenclature === idNomenclature);
      if (choix) {
        reponse.valeur_reponse = choix;
      }
    }
  
    const commentaire = this.formGroup.get(`reponse_${id_question}`)?.value ?? '';
    reponse!.commentaires = commentaire;
  
    const warnElement = document.querySelector(`.warn_${id_question}`);
  
    const valeurId = reponse!.valeur_reponse?.id_nomenclature ?? 0;
  
    if (commentaire !== '' && valeurId === 0) {
      reponse!.valeur_reponse = this.noResponse();
      warnElement?.classList.replace('warn', 'warn-partial');
    }else if (valeurId !== this.noResponse().id_nomenclature && valeurId > 0 || reponse!.question?.indications === "Sans indicateur") {
      warnElement?.classList.add('invisible');
    }
    if (cr?.libelle !== "Réponse avec commentaire"){
      this.submit(reponse);
    }
    
  }

  //Soumission du formulaire et attribution de l'état Réalisé ou En cours
  submit(reponse: Reponse): void {
    const acteurId = this.id_acteur();
    const questionId = reponse.question?.id_question;
    const valeurId = reponse.valeur_reponse?.id_nomenclature;

    if (!acteurId || !questionId || !valeurId || valeurId <= 0) {
      return;
    }

    reponse.acteur.id_acteur = acteurId;

    this.reponsesSubscription?.unsubscribe();
    this.reponsesSubscription = this.reponseService.update(reponse, acteurId).subscribe({
      next: (updated) => {
        const idx = this.reponses.findIndex(r => r.question?.id_question === questionId);
        if (idx >= 0) {
          updated.question = this.reponses[idx].question;
          updated.acteur.id_acteur = acteurId;
          this.reponses[idx] = updated;
        }
        this.toaster.success('Réponse enregistrée');
      },
      error: () => {
        this.toaster.error("Erreur lors de l'enregistrement de la réponse.");
      },
    });
  }

  
  getReponsesParQuestion(id_question: number) {
  
    return this.reponses.filter(r => r.question?.id_question === id_question);
  }

  ngOnDestroy(): void {
    this.initSub?.unsubscribe();
    this.nomenclatureSubscription?.unsubscribe();
    this.reponsesSubscription?.unsubscribe();
    this.lastLoadKey = '';
  }

  navigate(path:string,diagnostic:Diagnostic){
    
    this.siteService.navigateAndCache(path,diagnostic);
    
  }
}
