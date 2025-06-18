import { Component } from '@angular/core';
import {Location} from '@angular/common';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    standalone: false
})
export class ContactComponent {

  constructor(private _location: Location) 
  {}
  url ="https://formsubmit.co/katia.daudigeos@rnfrance.org";


  backClicked(){
    this._location.back();
  }
}
