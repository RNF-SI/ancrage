import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-alerte-mots-cles',
  templateUrl: './alerte-mots-cles.component.html',
  styleUrls: ['./alerte-mots-cles.component.css'],
  standalone:true,
  imports:[CommonModule,MatDialogModule,MatButtonModule,FontAwesomeModule,MatFormFieldModule,MatInputModule,FormsModule]
})
export class AlerteMotsClesComponent {
  constructor(
            public dialogRef: MatDialogRef<AlerteMotsClesComponent>,
            @Inject(MAT_DIALOG_DATA) public data: { 
              keyword:MotCle;
              listeMotsCles:MotCle[];
              sections:Nomenclature[];
            }
          ) {}

          explodeGroup(){
            console.log(this.data.listeMotsCles);
            for(let i = 0;i<this.data.listeMotsCles.length;i++){
              if (this.data.listeMotsCles[i].id_mot_cle == this.data.keyword.id_mot_cle){
                this.data.listeMotsCles.splice(i,1);
              }
            }
            let id_categorie = 0;
            for(const cat of this.data.sections){
              if (cat.libelle == "Non classé"){
                id_categorie = cat.id_nomenclature;
              }
            }
            for(let mc of this.data.keyword.mots_cles_issus){
              mc.categorie = new Nomenclature();
              mc.categorie = this.data.keyword.categorie;
              this.data.listeMotsCles.push(mc);

            }
            console.log(this.data.listeMotsCles);
            this.dialogRef.close(this.data.listeMotsCles);
          }

          rename(){

          }

          displayInput(){
            const element = document.getElementById("field");
            element?.classList.remove("invisible");
          }
  
          close(){
            this.dialogRef.close(this.data.listeMotsCles);
          }
  
}
