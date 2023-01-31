import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataFormService } from './form/data-form.service';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

import { HttpClientModule } from '@angular/common/http';


@NgModule({
  imports: [
  ],
  declarations: [



  ],
  providers: [
    DataFormService,
  ],
  entryComponents: [
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,

  ]
})

export class GN2CommonModule {
  constructor(
  ) {
  }
}
