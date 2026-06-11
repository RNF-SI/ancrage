import { Site } from '@app/models/site.model';

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function siteMatchScore(site: Site, normalizedInput: string): number {
  const nom = normalizeText(site.nom ?? '');
  if (nom === normalizedInput) return 0;
  if (nom.startsWith(normalizedInput)) return 1;
  if (nom.includes(normalizedInput)) return 2;
  return 99;
}

export function filterSites(sites: Site[], filterValue: string, limit = 50): Site[] {
  const normalizedInput = normalizeText(filterValue.trim());
  if (!normalizedInput) return sites;

  return sites
    .filter(site => normalizeText(site.nom ?? '').includes(normalizedInput))
    .sort((a, b) => {
      const scoreDiff = siteMatchScore(a, normalizedInput) - siteMatchScore(b, normalizedInput);
      return scoreDiff !== 0 ? scoreDiff : (a.nom ?? '').localeCompare(b.nom ?? '', 'fr');
    })
    .slice(0, limit);
}
