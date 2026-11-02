import { formatClock } from '../../lib/format';
import type { Translator } from './i18n/translate';
import type { ClipRef, Figure, Id, Score, Unit } from './types';

export const player = (id: Id) => `P${id}`;
export const teamTone = (id: Id | null) => (id ? `var(--team-${id})` : 'var(--neutral)');
export const pct = (t: Translator, n: number | null) => (n === null ? '–' : `${t.number(n * 100)}%`);
export const score = (s: Score, order: Id[]) => order.map((id) => s[id]).join('–');
export const clock = formatClock;
// The fill for the i-th category of a split; past the fifth, the lightest repeats.
export const ramp = (i: number) => `var(--v2-cat-${Math.min(i, 4) + 1})`;
// A dash where the logs have no value.
export const orNone = (text: string | null | false) => text || '–';

// One figure in its unit: "55%", "6.4", "2.1 s", "74 km/h".
export function figure(t: Translator, unit: Unit, f: Figure | number | null): string {
  const n = typeof f === 'number' || f === null ? f : f.value;
  if (n === null) return '–';
  switch (unit) {
    case 'pct':
      return pct(t, n);
    case 'count':
      return t.number(n);
    case 'avg':
      return t.number(n, 1);
    case 'sec':
      return t('unit.sec', { n: t.number(n, 1) });
    case 'kmh':
      return t('unit.kmh', { n: t.number(n) });
    case 'm':
      return t('unit.m', { n: t.number(n, 1) });
    case 'shots':
      return t('unit.shots', { n: t.number(n) });
  }
}

// "12 of 22", only for rates.
export const sample = (t: Translator, f: Figure) => (f.of === undefined ? null : t('of', { made: f.made ?? 0, of: f.of }));

// "Game 2" or "Match" for a report id.
export const reportLabel = (t: Translator, id: string) =>
  id.endsWith('_match') ? t('nav.match') : t('nav.game', { n: Number(id.match(/game_(\d+)$/)?.[1] ?? 0) });

export const rallyRef = (t: Translator, r: ClipRef, match: boolean) =>
  match ? t('rally.ref', { game: r.game, n: r.rally_number }) : t('rally.ref_short', { n: r.rally_number });

// Where a figure sits on a 0-1 track: rates as they are, other units against the larger of the two sides.
export function position(unit: Unit, values: (number | null)[]) {
  if (unit === 'pct') return values;
  const top = Math.max(...values.map((v) => v ?? 0)) * 1.15 || 1;
  return values.map((v) => (v === null ? null : v / top));
}

// Both teams of one figure, ready for a two-dot track, Team 1 first; the reader's team is drawn larger.
export function sides(t: Translator, unit: Unit, figures: Record<Id, Figure>, own: Id) {
  const ids = Object.keys(figures);
  const at = position(unit, ids.map((id) => figures[id].value));
  return ids.map((id, i) => ({
    key: id,
    name: t('team', { id }),
    tone: teamTone(id),
    at: at[i],
    text: figure(t, unit, figures[id]),
    detail: sample(t, figures[id]),
    own: id === own,
  }));
}
