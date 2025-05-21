import Dexie, { Table } from 'dexie';
import { Diagnostic } from '@app/models/diagnostic.model';

export interface CachedDiagnostic {
  id?: number; // clé primaire auto-incrémentée
  diagnostic: Diagnostic;
  timestamp: number;
}

export class DiagnosticCacheDb extends Dexie {
  diagnostics!: Table<CachedDiagnostic, number>;

  constructor() {
    super('DiagnosticCache');
    this.version(1).stores({
      diagnostics: '++id, timestamp',
    });
  }
}

export const diagnosticCacheDb = new DiagnosticCacheDb();