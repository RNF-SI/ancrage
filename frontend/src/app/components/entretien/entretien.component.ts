import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Nomenclature } from '@app/models/nomenclature.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { Labels } from '@app/utils/labels';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Reponse } from '@app/models/reponse.model';
import { Acteur } from '@app/models/acteur.model';
import { ReponseService } from '@app/services/reponse.service';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MatDialog } from '@angular/material/dialog';
import { AlerteEntretienComponent } from '../alertes/alerte-entretien/alerte-entretien.component';

@Component({
  selector: 'app-entretien',
  templateUrl: './entretien.component.html',
  styleUrls: ['./entretien.component.css'],
  standalone:true,
  imports:[CommonModule,MatRadioModule,ReactiveFormsModule,MatRadioModule,MatButtonModule,]

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
  private dialog = inject(MatDialog);

  ngOnInit(): void {
     this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_acteur = parseInt(params['id_acteur']); 
          this.title = this.labels.addInterview;
          this.nomenclatureSubscription = this.nomenclatureService.getAllByType("thème",this.id_acteur).subscribe(themes => {
            this.themes = themes;
            console.log(themes);
            const controls: { [key: string]: any } = {};
            this.themes.forEach(theme => {
              
              theme.questions!.forEach(q => {
                controls[`question_${q.id_question}`] = this.fb.control(null);
                if (this.id_acteur){
                  q.reponses?.forEach(rep => {
                    if(!this.reponses.includes(rep)){
                      this.reponses.push(rep);
                    }
                  });
                }else{
                  let reponse = new Reponse();
                  reponse.question = q;
                  reponse.acteur.id_acteur = 1;

                  this.reponses.push(reponse);

                }
              
                
              });
            });
            
            this.formGroup = this.fb.group(controls);
            if (this.id_acteur){
              for(let i = 0;i<this.reponses.length;i++){
                this.formGroup.get(`question_${this.reponses[i].question?.id_question}`)?.setValue(this.reponses[i].valeur_reponse.value);
              }
            }
          })
          
        });
  }

  createReponse(typeReponse:Nomenclature,id_question:number){
    
    for(let i = 0;i<this.reponses.length;i++){
      if(this.reponses[i].question?.id_question === id_question){
        this.reponses[i].valeur_reponse = typeReponse;
        break;
      }
      
    }
  }

  submit(){
    let responsesToSend:Reponse[] = [];
    this.reponses.forEach(rep=>{
      if (rep.valeur_reponse.id_nomenclature > 0){
        responsesToSend.push(rep);
      }
    })
    if (responsesToSend.length>0){
      this.reponsesSubscription = this.reponseService.update(responsesToSend).subscribe(acteur => {
        this.getConfirmation("Vous venez de saisir les réponses de",acteur);
      })
    }
    
  }

   getConfirmation(message:string,actor:Acteur){
        this.previousPage = localStorage.getItem("previousPage")!;
        /* this.diagnostic=diag;
        localStorage.setItem("diagnostic",JSON.stringify(this.diagnostic)); */
       
        if(actor.id_acteur > 0){
         
          this.dialog.open(AlerteEntretienComponent, {
            data: {
              title: this.title,
              message: message,
              labels: this.labels,
              actor: actor,
              diagnostic:this.diagnostic,
              previousPage:this.previousPage
            }
          });
        }
        
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.nomenclatureSubscription?.unsubscribe();
    this.reponsesSubscription?.unsubscribe();
  }
}
