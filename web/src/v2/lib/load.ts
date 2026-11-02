import type { ReportV2 } from './types';

const files = import.meta.glob<ReportV2>('../../../../docs/demo/reports/v2/*.json', { import: 'default' });
const cache = new Map<string, Promise<ReportV2>>();

const isMatch = (id: string) => id.endsWith('_match');

// Report ids: games in number order, then the match.
export const reportIds = Object.keys(files)
  .map((path) => path.slice(path.lastIndexOf('/') + 1, -'.json'.length))
  .sort((a, b) => Number(isMatch(a)) - Number(isMatch(b)) || a.localeCompare(b, undefined, { numeric: true }));

// Returns the same promise for the same id, so React's `use` can suspend on it.
export function loadReport(id: string): Promise<ReportV2> {
  let report = cache.get(id);
  if (!report) {
    const path = Object.keys(files).find((p) => p.endsWith(`/${id}.json`));
    report = path ? files[path]() : Promise.reject(new Error(`No v2 report named ${id}`));
    cache.set(id, report);
  }
  return report;
}
