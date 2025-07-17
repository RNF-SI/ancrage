import { Component } from '@angular/core';
import { AppConfig } from 'src/conf/app.config';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css']
})
export class IndexComponent {
    datesFormation:string = AppConfig.datesFormation;
}
