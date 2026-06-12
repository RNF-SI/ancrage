import { Component, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MotCleService } from '@app/services/mot-cle.service';
import { Labels } from '@app/utils/labels';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

export interface AlerteMotsClesData {
  keyword: MotCle;
  listeMotsCles: MotCle[];
  sections: Nomenclature[];
  modeAnalyse: boolean;
  canEdit?: boolean;
}

@Component({
    selector: 'app-alerte-mots-cles',
    templateUrl: './alerte-mots-cles.component.html',
    styleUrls: ['./alerte-mots-cles.component.css'],
    imports: [
      MatDialogModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      FontAwesomeModule,
      FormsModule
    ]
})
export class AlerteMotsClesComponent implements OnInit, OnDestroy {
  constructor(
    public dialogRef: MatDialogRef<AlerteMotsClesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlerteMotsClesData
  ) {}

  labels = new Labels();
  readonly showRenameField = signal(false);
  private kwSub?: Subscription;
  private kwService = inject(MotCleService);
  private toastr = inject(ToastrService);
  private mot_cle_origine = new MotCle();
  private hasChanges = false;

  ngOnInit(): void {
    this.mot_cle_origine = this.data.keyword;
    this.data.keyword.mots_cles_issus = [...(this.data.keyword.mots_cles_issus ?? [])];
  }

  get categoryLabel(): string {
    return this.data.keyword.categorie?.libelle ?? '';
  }

  get totalOccurrences(): number {
    return this.data.keyword.nombre ?? 0;
  }

  get canEdit(): boolean {
    return this.data.canEdit !== false;
  }

  excludeFromGroup(child: MotCle): void {
    if (!this.canEdit) {
      return;
    }
    const parent = this.data.keyword;
    parent.mots_cles_issus = (parent.mots_cles_issus ?? []).filter(
      mc => mc.id_mot_cle !== child.id_mot_cle
    );
    child.mot_cle_id_groupe = undefined;

    if (parent.nombre != null && child.nombre != null) {
      parent.nombre = Math.max(0, parent.nombre - child.nombre);
    }

    if (!this.data.listeMotsCles.some(mc => mc.id_mot_cle === child.id_mot_cle)) {
      child.categorie = parent.categorie ?? child.categorie;
      this.data.listeMotsCles.push(child);
    }

    this.hasChanges = true;
    this.toastr.info(this.labels.afomWordExcludedFromGroup);

    if (parent.mots_cles_issus.length === 0) {
      this.dissolveGroup(parent);
      return;
    }

    if (parent.mots_cles_issus.length === 1) {
      this.promoteLastChild(parent);
    }
  }

  private promoteLastChild(parent: MotCle): void {
    const last = parent.mots_cles_issus[0];
    last.mot_cle_id_groupe = undefined;
    if (parent.nombre != null) {
      last.nombre = parent.nombre;
    }
    this.dissolveGroup(parent, last);
  }

  private dissolveGroup(parent: MotCle, extraChild?: MotCle): void {
    this.data.listeMotsCles = this.data.listeMotsCles.filter(mc => mc.id_mot_cle !== parent.id_mot_cle);

    const children = extraChild
      ? [extraChild]
      : (parent.mots_cles_issus ?? []);

    for (const child of children) {
      child.mot_cle_id_groupe = undefined;
      if (!this.data.listeMotsCles.some(mc => mc.id_mot_cle === child.id_mot_cle)) {
        child.categorie = parent.categorie ?? child.categorie;
        this.data.listeMotsCles.push(child);
      }
    }

    this.dialogRef.close(this.data.listeMotsCles);
  }

  explodeGroup(): void {
    this.dissolveGroup(this.data.keyword);
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
    mot_cle.mots_cles_issus = [...(this.mot_cle_origine.mots_cles_issus ?? [])];
    for (let i = 0; i < this.data.listeMotsCles.length; i++) {
      if (this.data.listeMotsCles[i].id_mot_cle === this.mot_cle_origine.id_mot_cle) {
        this.data.listeMotsCles[i] = mot_cle;
      }
    }
    this.dialogRef.close(this.data.listeMotsCles);
  }

  displayInput(): void {
    this.showRenameField.set(true);
  }

  applyAndClose(): void {
    if (this.hasChanges) {
      this.dialogRef.close(this.data.listeMotsCles);
    } else {
      this.dialogRef.close();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.kwSub?.unsubscribe();
  }
}
