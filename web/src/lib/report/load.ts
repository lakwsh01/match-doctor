import { isMatchId } from '../format';
import type { GameReport, MatchReport } from './analysis';

type AnyReport = GameReport | MatchReport;

const files = import.meta.glob<AnyReport>('../../../../docs/demo/reports/*.json', { import: 'default' });
const cache = new Map<string, Promise<AnyReport>>();

// Report ids: games in number order, then the match summary.
export const reportIds = Object.keys(files)
  .map((path) => path.slice(path.lastIndexOf('/') + 1, -'.json'.length))
  .sort((a, b) => Number(isMatchId(a)) - Number(isMatchId(b)) || a.localeCompare(b, undefined, { numeric: true }));

// Returns the same promise for the same id, so React's `use` can suspend on it.
export function loadReport(id: string): Promise<AnyReport> {
  let report = cache.get(id);
  if (!report) {
    const path = Object.keys(files).find((p) => p.endsWith(`/${id}.json`));
    report = path ? files[path]() : Promise.reject(new Error(`No report named ${id}`));
    cache.set(id, report);
  }
  return report;
}
