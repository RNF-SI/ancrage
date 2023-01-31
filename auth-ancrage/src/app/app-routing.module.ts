import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LazyDialogLoader } from './loginModule/lazy-dialog/lazy-dialog.service';

const routes: Routes = [
  {
    path: 'login',
    canActivate: [ LazyDialogLoader ],
    loadChildren: () => import('./loginModule/login.module').then(m => m.LoginModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
