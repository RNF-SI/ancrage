import { Component } from '@angular/core';
import {Location} from '@angular/common';
import { Router } from '@angular/router';


@Component({
    selector: 'app-mentions',
    templateUrl: './mentions.component.html',
    styleUrls: ['./mentions.component.css']
})
export class MentionsComponent {

  constructor(private _location: Location, private _router: Router) 
  {}

  backClicked(){
    this._location.back();
  }

}
