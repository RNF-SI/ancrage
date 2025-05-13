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
  id_nomenclature = 0;
  private routeSubscription?:Subscription;
  private nomenclatureSubscription?:Subscription;
  private reponsesSubscription?:Subscription;
  private nomenclatureService = inject(NomenclatureService);
  private route= inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private reponseService = inject(ReponseService);
  reponses:Reponse[] = [];
  formGroup: FormGroup = this.fb.group({
        
  });

  ngOnInit(): void {
     this.routeSubscription = this.route.params.subscribe((params: any) => {
          this.id_nomenclature = params['id_nomenclature'];  
      
          this.nomenclatureSubscription = this.nomenclatureService.getAllByType("thème").subscribe(themes => {
            this.themes = themes;
            const controls: { [key: string]: any } = {};
            this.themes.forEach(theme => {
              
              theme.questions!.forEach(q => {
                controls[`question_${q.id_question}`] = this.fb.control(null);
                let reponse = new Reponse();
                reponse.question = q;
                reponse.acteur.id_acteur = 1;
                this.reponses.push(reponse);
                
              });
            });
            
            this.formGroup = this.fb.group(controls);
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
    this.reponsesSubscription = this.reponseService.update(this.reponses).subscribe(acteur => {
      console.log(acteur);
    })
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.nomenclatureSubscription?.unsubscribe();
    this.reponsesSubscription?.unsubscribe();
  }
}
