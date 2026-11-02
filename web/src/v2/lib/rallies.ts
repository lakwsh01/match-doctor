import type { GameReport, RallyReport } from '../../lib/report/analysis.ts';
import type { Id } from '../../lib/report/types';
import type { ClipRef, Height } from './types';

export type Shot = RallyReport['shots'][number];
export type GameRally = RallyReport & { game: number };
export type Court = GameReport['court'];

// The court bands of the field dictionary, by distance from the net: up to the kitchen line plus a step,
// the transition zone, and the last 1.5 m before the baseline.
const KITCHEN_REACH_M = 0.75;
const BASELINE_BAND_M = 1.5;
// Contacts lower than this below the net top are under the ground: tracking noise.
const GROUND_M = -0.914;

export const gameNumber = (id: string) => Number(id.match(/_game_(\d+)$/)?.[1] ?? 1);

export const gameRallies = (games: GameReport[]): GameRally[] =>
  games.flatMap((g) => g.rallies.map((r) => ({ ...r, game: gameNumber(g.id) })));

export const ref = (r: GameRally): ClipRef => ({ game: r.game, rally_number: r.rally_number });

export const family = (gesture: string) => gesture.replace(/^(forehand|backhand)_/, '');

export const isSoft = (gesture: string) => ['dink', 'drop', 'reset'].includes(family(gesture));

export const isSpeedup = (s: Shot) => s.gesture === 'speedup' || s.attack?.type === 'speedup';

export function band(court: Court, y: number): 'kitchen' | 'transition' | 'baseline' {
  const fromNet = Math.abs(y - court.net_y_m);
  if (fromNet <= court.kitchen_depth_m + KITCHEN_REACH_M) return 'kitchen';
  return fromNet >= court.net_y_m - BASELINE_BAND_M ? 'baseline' : 'transition';
}

// Cell 0-8 of one half: rows from the net back (kitchen, transition, baseline), columns left to right
// as seen by a player standing on that half facing the net.
export function cell(court: Court, x: number, y: number) {
  const row = ['kitchen', 'transition', 'baseline'].indexOf(band(court, y));
  const third = Math.min(2, Math.max(0, Math.floor((x / court.width_m) * 3)));
  const near = y > court.net_y_m;
  return row * 3 + (near ? third : 2 - third);
}

export function height(meters: number): Height | null {
  if (meters < GROUND_M) return null;
  if (meters < -0.1) return 'below';
  return meters <= 0.1 ? 'level' : 'above';
}

// Distance from the bounce to the baseline of the half it landed in.
export const toBaseline = (court: Court, y: number) => (y > court.net_y_m ? court.length_m - y : y);

export function depthBucket(court: Court, y: number): 'deep' | 'middle' | 'short' {
  const d = toBaseline(court, y);
  return d <= 1.5 ? 'deep' : d <= 3.5 ? 'middle' : 'short';
}

export const teamOf = (games: GameReport[]) => {
  const map = new Map(games[0].players.map((p) => [p.player_id, p.team_id]));
  return (player: Id | null) => (player ? (map.get(player) ?? null) : null);
};

// Shares of each label, in the order given.
export function sharesOf(labels: string[], order: readonly string[]) {
  return order.map((label) => ({ label, value: labels.length ? labels.filter((l) => l === label).length / labels.length : 0 }));
}

export const cells = (indexes: number[]) => {
  const counts = Array.from({ length: 9 }, (_, i) => indexes.filter((c) => c === i).length);
  const total = indexes.length || 1;
  return counts.map((n) => n / total);
};
