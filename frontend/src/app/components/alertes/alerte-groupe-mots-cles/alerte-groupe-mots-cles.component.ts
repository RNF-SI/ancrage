import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { Diagnostic } from '@app/models/diagnostic.model';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'ngx-toastr';
import { Labels } from '@app/utils/labels';

//Popup qui apparaît à la fusion de deux mots-clés
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
            labels:Labels
          }
        ) {}
 
  keyword = new MotCle();
  private toastr = inject(ToastrService);
  
  compareNomenclatures = (a: Nomenclature, b: Nomenclature): boolean =>
    a && b ? a.id_nomenclature === b.id_nomenclature : a === b;

  //Création d'un groupe
  createGroup() {
    const nomOk = this.keyword.nom && this.keyword.nom.trim().length > 0;
    const categorieOk = this.keyword.categorie && this.keyword.categorie.id_nomenclature;
  
    if (nomOk && categorieOk) {
      // Attache le diagnostic
      this.keyword.diagnostic = new Diagnostic();
      this.keyword.diagnostic.id_diagnostic = this.data.diagnostic.id_diagnostic;
  
      // Regroupe les mots-clés enfants (source et target)
      this.keyword.mots_cles_issus = [this.data.source, this.data.target];
  
      // Supprime les mots-clés enfants de la liste des réponses
      this.data.motsClesReponse = this.data.motsClesReponse.filter(mc =>
        mc.id_mot_cle !== this.data.source.id_mot_cle &&
        mc.id_mot_cle !== this.data.target.id_mot_cle
      );
  
      // Calcule le total si les deux ont un "nombre"
      if (this.data.source.nombre && this.data.target.nombre) {
        this.keyword.nombre = this.data.source.nombre + this.data.target.nombre;
      }
  
      // Ajoute le nouveau groupe
      this.data.motsClesReponse.push(this.keyword);
      // Ferme le dialogue en renvoyant la liste mise à jour
      this.dialogRef.close(this.data.motsClesReponse);
    } else {
      let message = 'Il manque :';
      if (!nomOk) message += '\n- le nom';
      if (!categorieOk) message += '\n- une catégorie';
      this.toastr.warning(message, 'Données manquantes');
    }
  }
  
  close() {
    this.dialogRef.close(this.data.motsClesReponse);
  }
  
}
