import { Injectable } from '@angular/core';
import { Diagnostic } from '@app/models/diagnostic.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticStoreService{

  private diagnostic$ = new BehaviorSubject<Diagnostic | null>(null);

  setDiagnostic(newDiag: Diagnostic) {
    const current = this.diagnostic$.getValue();

    // ✅ Ne pas réémettre si le même objet est déjà stocké
    if (JSON.stringify(current) === JSON.stringify(newDiag)) return;

    this.diagnostic$.next(newDiag);
  }

  getDiagnostic(): Observable<Diagnostic | null> {
    return this.diagnostic$.asObservable();
  }
}
