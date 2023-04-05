import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { LoginComponent } from './login-component/login.component';
import { FormsModule }   from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InputErrorPipe } from '@app/pipes/input-error.pipe';
import { ActionLinkObserver } from './action-link/action-link.service';
import { LazyDialogLoader } from './lazy-dialog/lazy-dialog.service';



/** Dialog route. This route will be used by the LazyDialogLoader, emulating the router, to lazily load the dialog */
const routes = [{
  path: '',
  content: 'login',
  component: LoginComponent,
  data: { dialogConfig: { width: 350, maxWidth: '100%' }}
}];

@NgModule({

  declarations: [
    LoginComponent,
    InputErrorPipe
   ],

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ActionLinkObserver,
    LazyDialogLoader
  ]
})
export class LoginModule { }
