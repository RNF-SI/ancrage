import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Nomenclature } from '@app/models/nomenclature.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';


@Component({
  selector: 'app-menu-lateral',
  templateUrl: './menu-lateral.component.html',
  styleUrls: ['./menu-lateral.component.css'],
  standalone:true,
  imports:[CommonModule,MatExpansionModule,MatListModule]
})
export class MenuLateralComponent{
 
  @Input() themes:Nomenclature[]=[];

  scrollToQuestion(id: number) {
    const el = document.getElementById('question-' + id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

}
