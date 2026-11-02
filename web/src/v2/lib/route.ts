// The v2 page lives at /v2/<report id>/<tab>[/<player id or "pair-<team id>">].
export const TABS = ['diagnosis', 'rally', 'momentum', 'players', 'plan'] as const;
export type Tab = (typeof TABS)[number];
export type Route = { report: string | null; tab: Tab; subject: string | null };

export const PREFIX = '/v2';

export const isV2Path = (path: string) => path === PREFIX || path.startsWith(`${PREFIX}/`);

export function parseRoute(path: string): Route {
  const [report, tab, subject] = path.slice(PREFIX.length).split('/').filter(Boolean).map(decodeURIComponent);
  return { report: report ?? null, tab: TABS.includes(tab as Tab) ? (tab as Tab) : 'diagnosis', subject: subject ?? null };
}

export function routePath({ report, tab, subject }: Route) {
  const parts = report ? [report, tab, ...(subject ? [subject] : [])] : [];
  return [PREFIX, ...parts.map(encodeURIComponent)].join('/');
}
