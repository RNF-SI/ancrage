import { Component,OnInit } from '@angular/core';
import { Diagnostic } from '@app/models/diagnostic.model';
import * as moment from 'moment';

@Component({
  selector: 'app-diagostics-liste',
  templateUrl: './diagnostics-liste.component.html',
  styleUrls: ['./diagnostics-liste.component.css']
})
export class DiagosticsListeComponent implements OnInit{
  diagnostics: Diagnostic[] = []; 
  ngOnInit(): void {
  
    for(let i=0;i<20;i++){
      const momentRandom = require('moment-random');
      let momentum:moment.Moment = moment();
      
      let moment_rand=momentRandom(momentum);
      moment_rand.locale('fr')
      let diag = new Diagnostic();
      diag.id=i;
      diag.nom="Diagnostic"+i;
      diag.date_debut=moment_rand.format('DD MMMM YYYY')
      this.diagnostics.push(diag);
    }
  }
  
  modifyDiagnostic(diagnostic: Diagnostic) {
    throw new Error('Method not implemented.');
  }

}

