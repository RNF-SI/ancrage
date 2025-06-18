import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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


//Page de la saisie de l'entretien
@Component({
    selector: 'app-entretien',
    templateUrl: './entretien.component.html',
    styleUrls: ['./entretien.component.css'],
    imports: [CommonModule, MatRadioModule, ReactiveFormsModule, MatRadioModule, MatButtonModule, MenuLateralComponent, FontAwesomeModule, MotsClesZoneComponent, MatTabsModule]
})
export class EntretienComponent implements OnInit,OnDestroy{
 
  labels = new Labels();
  title="";
  themes:Nomenclature[] = [];
  id_acteur = 0;
  private routeSubscription?:Subscription;
  private nomenclatureSubscription?:Subscription;
  private reponsesSubscription?:Subscription;
  private nomenclatureService = inject(NomenclatureService);
  private route= inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private reponseService = inject(ReponseService);
  reponses:Reponse[] = [];
  formGroup: FormGroup = this.fb.group({});
  previousPage = "";
  diagnostic:Diagnostic = new Diagnostic();
  etats:Nomenclature[]=[];
  siteService = inject(SiteService);
  slug="";
  noResponse:Nomenclature = new Nomenclature();
  afom = new Nomenclature();
  @ViewChild('afom') afomComponent!: MotsClesZoneComponent;
  menu:any;

  ngOnInit(): void {
  
    this.previousPage = localStorage.getItem("previousPage")!;
    this.diagnostic = JSON.parse(localStorage.getItem("diagnostic")!);
    this.routeSubscription = this.route.params.subscribe((params: any) => {
        this.id_acteur = parseInt(params['id_acteur']); 
        this.slug = params['slug'];  
        this.title = this.labels.addInterview;
        //Modification
        if (this.id_acteur && this.slug){
          const themes$ = this.nomenclatureService.getAllByType("thème_question",this.id_acteur);
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
    this.themes = themes;
            this.etats = etats;
            this.noResponse = noResponse;
            const controls: { [key: string]: any } = {};
            this.afom = themes[themes.length-1];
            
            this.themes.forEach(theme => {

              
              theme.questions!.forEach(q => {
                controls[`question_${q.id_question}`] = this.fb.control(null);
                controls[`reponse_${q.id_question}`] = this.fb.control(null);
                if (this.id_acteur){
                    let reponse:Reponse = new Reponse();
                      
                    reponse.question = q;
                    reponse.acteur.id_acteur = this.id_acteur;
                    
                
                  q.reponses?.forEach(rep => {
                    if (rep.acteur.id_acteur==this.id_acteur){
                      reponse = rep;
                    }
                  });
                  this.reponses.push(reponse);
                }
              });
            });
          
            this.formGroup = this.fb.group(controls);
            if (this.id_acteur){
              setTimeout(() => {
                this.patchForm(this.reponses);
              }, 0);
              
            }          
  }
  //Envoie les données récupérées au formulaire
  patchForm(reponses:Reponse[]){
    
    for(let i = 0;i<reponses.length;i++){
      this.formGroup.get(`question_${reponses[i].question?.id_question}`)?.setValue(reponses[i].valeur_reponse.value);
      this.formGroup.get(`reponse_${reponses[i].question?.id_question}`)?.setValue(reponses[i].commentaires);
      if (reponses[i].valeur_reponse.id_nomenclature > 0){
        const classe = ".warn_"+reponses[i].question?.id_question;
        const element = document.querySelector(classe);
       
        if (reponses[i].valeur_reponse.id_nomenclature == this.noResponse.id_nomenclature){
          element?.classList.replace("warn","warn-partial");
          if(reponses[i].question?.indications == "Sans indicateur"){
            element?.classList.add("invisible");
          }
        }else {
          element?.classList.add("invisible");
        }
        
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
      reponse!.valeur_reponse = this.noResponse;
      warnElement?.classList.replace('warn', 'warn-partial');
    }else if (valeurId !== this.noResponse.id_nomenclature && valeurId > 0 || reponse!.question?.indications === "Sans indicateur") {
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
      if ((valeurId !== this.noResponse.id_nomenclature && valeurId > 0) || isSansIndicateur) {
  
        reponsesCompletes++;
      }
    }
  
    if (totalReponses > 0) {
   
      this.reponsesSubscription = this.reponseService.updateAllButAfom(this.reponses).subscribe(
        themes => {
          this.prepareResults(themes,this.etats,this.noResponse);

        }
      );
    }
  }

  
  getReponsesParQuestion(id_question: number) {
  
    return this.reponses.filter(r => r.question?.id_question === id_question);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.nomenclatureSubscription?.unsubscribe();
    this.reponsesSubscription?.unsubscribe();
  }

  navigate(path:string,diagnostic:Diagnostic){
    
    this.siteService.navigateAndCache(path,diagnostic);
    
  }
}
