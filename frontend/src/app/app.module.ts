import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Modules
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClientModule } from '@angular/common/http';
import { GN2CommonModule } from '@geonature_common/GN2Common.module';
import {MatButtonModule} from '@angular/material/button';



// Services
import { ModuleService } from './services/module.service';

// Components
import { AncrageComponent } from './components/ancrage/ancrage.component';
import { IndexComponent } from './components/index/index.component';
import { LogoutComponent } from './components/logout/logout.component';

@NgModule({
  declarations: [
    AppComponent,
    AncrageComponent,
    IndexComponent,
    LogoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    HttpClientModule,
    GN2CommonModule,
    MatButtonModule
  ],
  providers: [
    ModuleService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
