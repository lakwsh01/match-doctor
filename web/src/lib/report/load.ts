import { gameLabel } from '../format';
import type { Report } from './types';

const files = import.meta.glob<Report>('../../../../docs/demo/raw/*.json', { import: 'default' });
const cache = new Map<string, Promise<Report>>();

type ReportEntry = { id: string; label: string };

export const reportEntries: ReportEntry[] = Object.keys(files)
  .map((path) => {
    const id = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
    return { id, label: gameLabel(id) };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

// Returns the same promise for the same id, so React's `use` can suspend on it.
export function loadReport(id: string): Promise<Report> {
  let report = cache.get(id);
  if (!report) {
    const path = Object.keys(files).find((p) => p.endsWith(`/${id}.json`));
    report = path ? files[path]() : Promise.reject(new Error(`No report named ${id}`));
    cache.set(id, report);
  }
  return report;
}
