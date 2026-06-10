import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
    imports: [
      MatButtonModule,
      CommonModule,
      MatDialogModule,
      FormsModule,
      MatFormFieldModule,
      MatInputModule
    ]
})
export class AlerteGroupeMotsClesComponent {
  constructor(
    public dialogRef: MatDialogRef<AlerteGroupeMotsClesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      source: MotCle;
      target: MotCle;
      diagnostic: Diagnostic;
      motsClesReponse: MotCle[];
      categories: Nomenclature[];
    }
  ) {
    this.keyword.categorie = data.source.categorie ?? data.target.categorie;
  }

  labels = new Labels();
  keyword = new MotCle();
  private toastr = inject(ToastrService);

  get categoryLabel(): string {
    return this.keyword.categorie?.libelle ?? '—';
  }

  formatMotCleLabel(motCle: MotCle): string {
    if (motCle.nombre != null && motCle.nombre > 0) {
      return `${motCle.nom} (${motCle.nombre})`;
    }
    return motCle.nom;
  }

  createGroup(): void {
    const nomOk = !!this.keyword.nom?.trim();
    const categorieOk = !!this.keyword.categorie?.id_nomenclature;

    if (!nomOk) {
      this.toastr.warning('Veuillez saisir un nom pour le groupe.', 'Données manquantes');
      return;
    }

    if (!categorieOk) {
      this.toastr.warning('La catégorie des mots-clés à regrouper est introuvable.', 'Données manquantes');
      return;
    }

    this.keyword.diagnostic = new Diagnostic();
    this.keyword.diagnostic.id_diagnostic = this.data.diagnostic.id_diagnostic;
    this.keyword.mots_cles_issus = [this.data.source, this.data.target];

    this.data.motsClesReponse = this.data.motsClesReponse.filter(mc =>
      mc.id_mot_cle !== this.data.source.id_mot_cle &&
      mc.id_mot_cle !== this.data.target.id_mot_cle
    );

    if (this.data.source.nombre != null && this.data.target.nombre != null) {
      this.keyword.nombre = this.data.source.nombre + this.data.target.nombre;
    }

    this.data.motsClesReponse.push(this.keyword);
    this.dialogRef.close(this.data.motsClesReponse);
  }

  close(): void {
    this.dialogRef.close();
  }
}
