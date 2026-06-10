import { Component, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MotCleService } from '@app/services/mot-cle.service';
import { Labels } from '@app/utils/labels';
import { firstValueFrom, Subscription } from 'rxjs';

// Alerte pour voir le contenu d'un groupe et le renommer
@Component({
    selector: 'app-alerte-mots-cles',
    templateUrl: './alerte-mots-cles.component.html',
    styleUrls: ['./alerte-mots-cles.component.css'],
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      FormsModule
    ]
})
export class AlerteMotsClesComponent implements OnInit, OnDestroy {
  constructor(
    public dialogRef: MatDialogRef<AlerteMotsClesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      keyword: MotCle;
      listeMotsCles: MotCle[];
      sections: Nomenclature[];
    }
  ) {}

  labels = new Labels();
  readonly showRenameField = signal(false);
  private kwSub?: Subscription;
  private kwService = inject(MotCleService);
  mot_cle_origine = new MotCle();

  ngOnInit(): void {
    this.mot_cle_origine = this.data.keyword;
  }

  formatMotCleLabel(motCle: MotCle): string {
    if (motCle.nombre != null && motCle.nombre > 0) {
      return `${motCle.nom} (${motCle.nombre})`;
    }
    return motCle.nom;
  }

  explodeGroup(): void {
    this.data.listeMotsCles = this.data.listeMotsCles.filter(
      mc => mc.id_mot_cle !== this.data.keyword.id_mot_cle
    );

    const fetches = this.data.keyword.mots_cles_issus.map(mc =>
      firstValueFrom(this.kwService.get(mc.id_mot_cle))
    );

    Promise.all(fetches).then(motsClesIssus => {
      motsClesIssus.forEach(mc => {
        this.data.listeMotsCles.push(mc);
      });
      this.dialogRef.close(this.data.listeMotsCles);
    }).catch(error => {
      console.error('Erreur lors de la récupération des enfants :', error);
      this.dialogRef.close(this.data.listeMotsCles);
    });
  }

  rename(): void {
    if (!this.data.keyword.nom?.trim()) {
      return;
    }

    this.data.keyword.categorie.mots_cles = [];
    const mc: MotCle = MotCle.fromJson(this.data.keyword);

    if (mc.id_mot_cle > 0) {
      this.kwSub = this.kwService.update(mc).subscribe(mot_cle => {
        this.traitement(mot_cle);
      });
    } else {
      this.kwSub = this.kwService.add(mc).subscribe(mot_cle => {
        this.traitement(mot_cle);
      });
    }
  }

  traitement(mot_cle: MotCle): void {
    mot_cle.nombre = this.mot_cle_origine.nombre;
    for (let i = 0; i < this.data.listeMotsCles.length; i++) {
      if (this.data.listeMotsCles[i] === this.mot_cle_origine) {
        this.data.listeMotsCles[i] = mot_cle;
      }
    }
    this.dialogRef.close(this.data.listeMotsCles);
  }

  displayInput(): void {
    this.showRenameField.set(true);
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.kwSub?.unsubscribe();
  }
}
