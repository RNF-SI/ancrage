import { CommonModule } from '@angular/common';
import { Component, Inject, inject, LOCALE_ID } from '@angular/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Diagnostic } from '@app/models/diagnostic.model';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';

//Alerte à la création ou modification d'un diagnostic
@Component({
    selector: 'app-alerte-diagnostic',
    templateUrl: './alerte-diagnostic.component.html',
    styleUrls: ['./alerte-diagnostic.component.css'],
    imports: [MatDialogModule, MatButtonModule, CommonModule],
    providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'DD/MM/YY',
                },
                display: {
                    dateInput: 'DD/MM/YY',
                    monthYearLabel: 'MMMM YYYY',
                    dateA11yLabel: 'LL',
                    monthYearA11yLabel: 'MMMM YYYY',
                },
            },
        },
    ]
})
export class AlerteDiagnosticComponent {
  constructor(
        public dialogRef: MatDialogRef<AlerteDiagnosticComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
          title: string; 
          message: string; 
          labels :Labels;
          diagnostic:Diagnostic;
          previousPage:string;
          no_creation:boolean;
        }
      ) {}
      
      private siteService = inject(SiteService);
    
    
      navigate(path:string,diagnostic:Diagnostic){
        
        this.dialogRef.close();
        this.siteService.navigateAndCache(path,diagnostic);
      }
      close(){
        this.dialogRef.close();
      }
}
