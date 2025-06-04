import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-alerte-groupe-mots-cles',
  templateUrl: './alerte-groupe-mots-cles.component.html',
  styleUrls: ['./alerte-groupe-mots-cles.component.css'],
  standalone:true,
  imports:[MatButtonModule,CommonModule,MatDialogModule,MatSelectModule,FormsModule,MatFormFieldModule,MatInputModule]
})
export class AlerteGroupeMotsClesComponent{
  constructor(
          public dialogRef: MatDialogRef<AlerteGroupeMotsClesComponent>,
          @Inject(MAT_DIALOG_DATA) public data: { 
            source: MotCle; 
            target: MotCle; 
            diagnostic:Diagnostic,
            motsClesReponse:MotCle[],
            categories:Nomenclature[]
          }
        ) {}
 
  keyword = new MotCle();
  
  compareNomenclatures = (a: Nomenclature, b: Nomenclature): boolean =>
    a && b ? a.id_nomenclature === b.id_nomenclature : a === b;

  createGroup(){
    if (this.keyword.nom && this.keyword.categories.length > 0) {
      this.keyword.diagnostic = new Diagnostic();
      this.keyword.diagnostic.id_diagnostic = this.data.diagnostic.id_diagnostic;
  
      this.keyword.mots_cles_issus = [this.data.source, this.data.target];
  
      // Supprimer les enfants de la réponse
      this.data.motsClesReponse = this.data.motsClesReponse.filter(mc =>
        mc.id_mot_cle !== this.data.source.id_mot_cle &&
        mc.id_mot_cle !== this.data.target.id_mot_cle
      );
  
      // Ajouter le groupe
      this.data.motsClesReponse.push(this.keyword);
  
      this.dialogRef.close(this.data.motsClesReponse);
      console.log(this.data.motsClesReponse);
    }else{
      alert('ko');
    }
  }

  close(){
    this.dialogRef.close();
  }
}
