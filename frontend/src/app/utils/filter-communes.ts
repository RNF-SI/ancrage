import { Commune } from '@app/models/commune.model';

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function communeMatchScore(commune: Commune, normalizedInput: string): number {
  const nom = normalizeText(commune.nom_com);
  if (nom === normalizedInput) return 0;
  if (nom.startsWith(normalizedInput)) return 1;
  if (nom.includes(normalizedInput)) return 2;
  if (normalizeText(commune.insee_com).includes(normalizedInput)) return 3;
  if (commune.code_dpt && normalizeText(commune.code_dpt).includes(normalizedInput)) return 4;
  return 99;
}

function communeMatches(commune: Commune, normalizedInput: string): boolean {
  const nom = normalizeText(commune.nom_com);
  const codeDptMatch = commune.code_dpt && normalizeText(commune.code_dpt).includes(normalizedInput);
  const inseeMatch = normalizeText(commune.insee_com).includes(normalizedInput);
  return nom.includes(normalizedInput) || !!codeDptMatch || inseeMatch;
}

export function filterCommunes(communes: Commune[], filterValue: string, limit = 30): Commune[] {
  const normalizedInput = normalizeText(filterValue.trim());
  if (!normalizedInput) return [];

  return communes
    .filter(c => communeMatches(c, normalizedInput))
    .sort((a, b) => {
      const scoreDiff = communeMatchScore(a, normalizedInput) - communeMatchScore(b, normalizedInput);
      return scoreDiff !== 0 ? scoreDiff : a.nom_com.localeCompare(b.nom_com, 'fr');
    })
    .slice(0, limit);
}
