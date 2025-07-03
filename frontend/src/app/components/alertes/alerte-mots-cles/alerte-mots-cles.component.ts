import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MotCleService } from '@app/services/mot-cle.service';
import { Labels } from '@app/utils/labels';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';

//Alerte pour voir contenu d'un groupe et le renommer
@Component({
    selector: 'app-alerte-mots-cles',
    templateUrl: './alerte-mots-cles.component.html',
    styleUrls: ['./alerte-mots-cles.component.css'],
    imports: [CommonModule, MatDialogModule, MatButtonModule, FontAwesomeModule, MatFormFieldModule, MatInputModule, FormsModule]
})
export class AlerteMotsClesComponent implements OnInit, OnDestroy{
  constructor(
            public dialogRef: MatDialogRef<AlerteMotsClesComponent>,
            @Inject(MAT_DIALOG_DATA) public data: { 
              keyword:MotCle;
              listeMotsCles:MotCle[];
              sections:Nomenclature[];
             
            }
          ) {}
          labels = new Labels();
          private kwSub?:Subscription;
          private kwService = inject(MotCleService);
          mot_cle_origine = new MotCle();

          ngOnInit(): void {
            this.mot_cle_origine = this.data.keyword;
       
          }

          //Dissocier groupe : pas utilisée 
          explodeGroup(){
         
            for(let i = 0;i<this.data.listeMotsCles.length;i++){
              if (this.data.listeMotsCles[i].id_mot_cle == this.data.keyword.id_mot_cle){
                this.data.listeMotsCles.splice(i,1);
              }
            }
            
            for(let mc of this.data.keyword.mots_cles_issus){
              mc.categorie = new Nomenclature();
              mc.categorie = this.data.keyword.categorie;
              this.data.listeMotsCles.push(mc);

            }
           
            this.dialogRef.close(this.data.listeMotsCles);
          }

          //Permet de renommer un groupe
          rename(){

            if (this.data.keyword.nom != ""){
              this.data.keyword.categorie.mots_cles = [];

              const mc:MotCle = MotCle.fromJson(this.data.keyword);
            
              if(mc.id_mot_cle > 0 ){
                this.kwSub = this.kwService.update(mc).subscribe(mot_cle =>{
              
                  this.traitement(mot_cle);
                });
              }else{
                this.kwSub = this.kwService.add(mc).subscribe(mot_cle =>{
                  this.traitement(mot_cle);
                });
              }
              
            }
            
          }

          //Traite les données reçues
          traitement(mot_cle:MotCle){
            mot_cle.nombre = this.mot_cle_origine.nombre;
            for(let i = 0;i<this.data.listeMotsCles.length;i++){
              if (this.data.listeMotsCles[i] == this.mot_cle_origine){
                this.data.listeMotsCles[i] = mot_cle;
                
              }
            }
        
            this.dialogRef.close(this.data.listeMotsCles);
          }

          //Permet d'afficher le champ pour renommer
          displayInput(){
            const element = document.getElementById("field");
            element?.classList.remove("invisible");
          }
  
          close(){
            this.dialogRef.close(this.data.listeMotsCles);
          }

          ngOnDestroy(): void {
            this.kwSub?.unsubscribe();
          }
  
}
