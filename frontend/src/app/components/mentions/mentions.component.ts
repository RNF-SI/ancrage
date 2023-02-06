import { Component } from '@angular/core';
import {Location} from '@angular/common';


@Component({
  selector: 'app-mentions',
  templateUrl: './mentions.component.html',
  styleUrls: ['./mentions.component.css']
})
export class MentionsComponent {

  constructor(private _location: Location) 
  {}

  backClicked(){
    this._location.back();
  }

}
