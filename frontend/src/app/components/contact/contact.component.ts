import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import { AppConfig } from 'src/conf/app.config';
import { Labels } from '@app/utils/labels';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MailService } from '@app/services/mail.service';
import { Subscription } from 'rxjs';
import { Mail } from '@app/models/mail.model';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    imports:[ReactiveFormsModule,MatFormFieldModule,MatButtonModule,MatInputModule,CommonModule,MatError]
})
export class ContactComponent implements OnDestroy{
  
  labels = new Labels();
  private _location = inject(Location);
  mail = AppConfig.contact;
  fb = inject(FormBuilder);
  formGroup = this.fb.group({
    nom: ['', [Validators.required]],
    mail: ['',[Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    destinataire: [AppConfig.contact],
    expediteur: ['',[Validators.required]],
    objet: ['', [Validators.required]],
    message: ['', [Validators.required]]
    
});
private mailService = inject(MailService);
private mailSub ?:Subscription;

recordMail(event : Event){
  event.preventDefault();
  console.log(this.formGroup.value);
  console.log(this.formGroup.valid);
  if (this.formGroup.valid){
    console.log('ok');
    const mail = Object.assign(new Mail(),this.formGroup.value);
    console.log(mail);
    this.mailSub = this.mailService.sendMail(mail).subscribe(mail =>{

    })
  }
}

backClicked(){
  this._location.back();
}

ngOnDestroy(): void {
  this.mailSub?.unsubscribe();
}

}
