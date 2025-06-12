import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Diagnostic } from '@app/models/diagnostic.model';
import { AlerteActeurComponent } from '../alerte-acteur/alerte-acteur.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { SiteService } from '@app/services/sites.service';
import { Labels } from '@app/utils/labels';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-alerte-date-publication',
  templateUrl: './alerte-date-publication.component.html',
  styleUrls: ['./alerte-date-publication.component.css'],
  imports:[MatButtonModule,MatDatepickerModule,MatFormFieldModule,FormsModule,MatInputModule,MatMomentDateModule,MatDialogModule,FontAwesomeModule,MatTooltipModule],
  standalone:true
})
export class AlerteDatePublicationComponent implements OnInit{
    constructor(
        public dialogRef: MatDialogRef<AlerteActeurComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { 
          labels :Labels,
          diagnostic:Diagnostic,
          previousPage:string
        }
      ) {}
      private siteService = inject(SiteService);
      private diagnosticService = inject(DiagnosticService);
      diagSub?:Subscription;
      infobulleSaisieDateRapport = "Attention ! Ne saisissez ce champ uniquement si vous avez publié votre rapport. Après la saisie de cette date, vous ne pourrez plus modifier le diagnostic.";
      private dateAdapter = inject(DateAdapter);

      ngOnInit(): void {
        this.dateAdapter.setLocale('fr-FR');
      }
      close(){
        this.dialogRef.close();
      }

      navigate(path:string,diagnostic:Diagnostic){
        
        this.dialogRef.close();
        this.siteService.navigateAndCache(path,diagnostic);
      }

      recordDiagnostic(){
        
        if (this.data.diagnostic.date_rapport_str){
          
          const momentDate = moment(this.data.diagnostic.date_rapport_str, "DD/MM/YYYY", true); 
          this.data.diagnostic.date_rapport = momentDate.isValid() ? momentDate.toDate() : undefined;
          let diagno:Diagnostic = Diagnostic.fromJson(this.data.diagnostic);
          this.diagSub =  this.diagnosticService.update(diagno).subscribe(diag=>{
            this.dialogRef.close();
          })
        }
        
      }
}
