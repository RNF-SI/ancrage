import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
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


//Page de la saisie de l'entretien
@Component({
    selector: 'app-entretien',
    templateUrl: './entretien.component.html',
    styleUrls: ['./entretien.component.css'],
    standalone:true,
    imports: [CommonModule, MatRadioModule, ReactiveFormsModule, MatRadioModule, MatButtonModule, MenuLateralComponent, FontAwesomeModule, MotsClesZoneComponent, MatTabsModule]
})
export class EntretienComponent implements OnDestroy{
 
  labels = new Labels();
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
  @ViewChild('afom') afomComponent!: MotsClesZoneComponent;
  menu:any;
  routeParams = toSignal(inject(ActivatedRoute).params, { initialValue: {} });

  constructor(){
    effect(() => {
      this.previousPage = localStorage.getItem("previousPage")!;
      this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
      const { id_acteur, slug } = this.routeParams() as Params;
      const id = Number(id_acteur);
      this.id_acteur.set(id);
      const slugValue = slug as string;
      this.title = this.labels.addInterview;
      //Modification
      if (id && slugValue){
        const themes$ = this.nomenclatureService.getAllByType("thème_question",id);
        const etats$ = this.nomenclatureService.getAllByType("statut_entretien");
        const noResponse$ = this.nomenclatureService.getNoResponse("");

        forkJoin([themes$,etats$,noResponse$]).subscribe(([themes,etats,noResponse]) => {
          this.prepareResults(themes,etats,noResponse);
          this.menu = document.getElementById("menu");
          setTimeout(() => {
            this.display();
          }, 0);
          
        });
      }
      
    });
  }

  prepareResults(themes:Nomenclature[],etats:Nomenclature[],noResponse:Nomenclature){
    this.reponses = [];
    this.themes.set(themes);
    this.etats.set(etats);
    this.noResponse.set(noResponse);
    const controls: { [key: string]: any } = {};
    this.afom = themes[themes.length-1];
    
    this.themes().forEach(theme => {

      
      theme.questions!.forEach(q => {
        controls[`question_${q.id_question}`] = this.fb.control(null);
        controls[`reponse_${q.id_question}`] = this.fb.control(null);
        if (this.id_acteur()){
            let reponse:Reponse = new Reponse();
              
            reponse.question = q;
            reponse.acteur.id_acteur = this.id_acteur();
            
        
          q.reponses?.forEach(rep => {
            if (rep.acteur.id_acteur==this.id_acteur()){
              reponse = rep;
            }
          });
          this.reponses.push(reponse);
        }
      });
    });
  
    this.formGroup = this.fb.group(controls);
    if (this.id_acteur() > 0){
      console.log(this.id_acteur());
      Promise.resolve().then(() => {
        this.patchForm(this.reponses);
      });
      
    }          
  }
  //Envoie les données récupérées au formulaire
  patchForm(reponses:Reponse[]){
    console.log(reponses);
    for(let i = 0;i<reponses.length;i++){
      this.formGroup.get(`question_${reponses[i].question?.id_question}`)?.setValue(reponses[i].valeur_reponse.value);
      this.formGroup.get(`reponse_${reponses[i].question?.id_question}`)?.setValue(reponses[i].commentaires);
      setTimeout(() => {
        this.hideWarnings(reponses,i);
      }, 0);
      
    }

  }

  hideWarnings(reponses:Reponse[],iteration:number){
    if (reponses[iteration].valeur_reponse.id_nomenclature > 0){
     
      const classe = ".warn_"+reponses[iteration].question?.id_question;
      
      const element = document.querySelector(classe);
      console.log(element);
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
    
    if (event.index === 0) { 
    
      this.display()
      
    }else{
      this.hide();
      
    }
  }

  //Affiche le menu
  hide(){
    if (this.menu?.className == "visible"){
      this.menu?.classList.remove("visible");
      this.menu?.classList.add("invisible");
    }
  }

  //cache le menu
  display(){

    if (this.menu?.className == "invisible"){
      this.menu?.classList.remove("invisible");
      this.menu?.classList.add("visible");
    }
  }
  
  //Met la liste de réponses à jour 
  createReponse = (id_question: number, cr?: Nomenclature) => {
    const reponse = this.reponses.find(r => r.question?.id_question === id_question);
    
    if (cr !== undefined) {
      reponse!.valeur_reponse = cr;
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
  
    this.submit();
  }

  //Soumission du formulaire et attribution de l'état Réalisé ou En cours
  submit(): void {
    const totalReponses = this.reponses.length;
    let reponsesCompletes = 0;
  
    for (const reponse of this.reponses) {
      const valeurId = reponse.valeur_reponse?.id_nomenclature ?? 0;
      const isSansIndicateur = reponse.question?.indications === "Sans indicateur";
      if ((valeurId !== this.noResponse().id_nomenclature && valeurId > 0) || isSansIndicateur) {
  
        reponsesCompletes++;
      }
    }
  
    if (totalReponses > 0) {
   
      this.reponsesSubscription = this.reponseService.updateAllButAfom(this.reponses).subscribe(
        themes => {
          this.prepareResults(themes,this.etats(),this.noResponse());

        }
      );
    }
  }

  
  getReponsesParQuestion(id_question: number) {
  
    return this.reponses.filter(r => r.question?.id_question === id_question);
  }

  ngOnDestroy(): void {
  
    this.nomenclatureSubscription?.unsubscribe();
    this.reponsesSubscription?.unsubscribe();
  }

  navigate(path:string,diagnostic:Diagnostic){
    
    this.siteService.navigateAndCache(path,diagnostic);
    
  }
}
