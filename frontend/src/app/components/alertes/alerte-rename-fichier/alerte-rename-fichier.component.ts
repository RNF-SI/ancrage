import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@app/utils/labels';

export interface RenameFichierDialogData {
  fileName: string;
}

@Component({
  selector: 'app-alerte-rename-fichier',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './alerte-rename-fichier.component.html',
  styleUrl: './alerte-rename-fichier.component.css',
})
export class AlerteRenameFichierComponent {
  labels = new Labels();
  baseName = '';
  extension = '';

  constructor(
    public dialogRef: MatDialogRef<AlerteRenameFichierComponent>,
    @Inject(MAT_DIALOG_DATA) data: RenameFichierDialogData,
  ) {
    const dotIndex = data.fileName.lastIndexOf('.');
    if (dotIndex > 0) {
      this.baseName = data.fileName.slice(0, dotIndex);
      this.extension = data.fileName.slice(dotIndex + 1);
    } else {
      this.baseName = data.fileName;
    }
  }

  confirm(): void {
    const trimmed = this.baseName.trim();
    if (!trimmed) return;
    this.dialogRef.close(trimmed);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
