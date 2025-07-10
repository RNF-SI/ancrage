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
import { RECAPTCHA_V3_SITE_KEY, ReCaptchaV3Service, RecaptchaFormsModule, RecaptchaV3Module } from "ng-recaptcha-2";
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    imports:[ReactiveFormsModule,MatFormFieldModule,MatButtonModule,MatInputModule,CommonModule,MatError,RecaptchaV3Module,RecaptchaFormsModule],
    
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
    message: ['', [Validators.required]],
    token: [''],
    
  });
  private mailService = inject(MailService);
  private mailSub ?:Subscription;
  captchaToken: string | null = null;
  private recaptchaService = inject(ReCaptchaV3Service);
  public log: string[] = [];
  public declarativeFormCaptchaValue ?: string;
  private toaster = inject(ToastrService);

  recordMail(event : Event){
    event.preventDefault();

    if (this.formGroup.valid){
      this.recaptchaService.execute('contact_form').subscribe(token => {
        this.captchaToken = token;
       
        if (this.captchaToken) {
          
          const mail = Object.assign(new Mail(), this.formGroup.value);
          mail.token = token;
          this.mailSub = this.mailService.sendMail(mail).subscribe(
            reponse=>{
              this.toaster.info(reponse.message);
            }
          );
        }
      });

    }
  }

  backClicked(){
    this._location.back();
  }

  ngOnDestroy(): void {
    this.mailSub?.unsubscribe();
  }
}
