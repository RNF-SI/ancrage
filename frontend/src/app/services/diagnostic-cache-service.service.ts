import { Injectable } from '@angular/core';
import { Diagnostic } from '@app/models/diagnostic.model';
import { diagnosticCacheDb } from '@app/utils/diagnostic-cache-db';


@Injectable({
  providedIn: 'root'
})
export class DiagnosticCacheService {

  async save(diagnostic: Diagnostic): Promise<number> {
    return await diagnosticCacheDb.diagnostics.add({
      diagnostic,
      timestamp: Date.now()
    });
  }

  async get(id: number): Promise<Diagnostic | null> {
    const entry = await diagnosticCacheDb.diagnostics.get(id);
    return entry?.diagnostic || null;
  }

  async delete(id: number): Promise<void> {
    await diagnosticCacheDb.diagnostics.delete(id);
  }

  async clear(): Promise<void> {
    await diagnosticCacheDb.diagnostics.clear();
  }
}