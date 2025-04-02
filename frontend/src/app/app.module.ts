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
import { MatButtonModule} from '@angular/material/button';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

// Components
import { AncrageComponent } from './components/ancrage/ancrage.component';
import { IndexComponent } from './components/index/index.component';
import { LogoutComponent } from './components/logout/logout.component';
import { IntroConnectComponent } from './components/intro-connect/intro-connect.component';
import { ContactComponent } from './components/contact/contact.component';
import { MentionsComponent } from './components/mentions/mentions.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [
    AppComponent,
    AncrageComponent,
    IndexComponent,
    LogoutComponent,
    IntroConnectComponent,
    ContactComponent,
    MentionsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    HttpClientModule,
    MatButtonModule,
    HomeRnfModule,
    RouterModule,
    NgbModule,
    ToastrModule.forRoot({
      timeOut: 15000
    }),
  ],
  providers: [
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
