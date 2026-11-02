import { rate } from '../../lib/stats.ts';
import type { Rate } from '../../lib/stats.ts';
import type { PlayerReport } from '../../lib/report/player.ts';
import type { Id } from '../../lib/report/types';
import type { Context } from './context.ts';
import { band, depthBucket, family, isSoft, isSpeedup, sharesOf } from './rallies.ts';
import type { GameRally, Shot } from './rallies.ts';
import { between, shares, whole } from './seed.ts';
import type { Figure, Metric, MetricKey, Part, Phase, Source, Split, SplitKey, Unit } from './types';

export const fromRate = (r: Rate): Figure => ({ value: r.pct, made: r.made, of: r.of });
const sum = (rates: Rate[]) => fromRate(rate(rates.reduce((s, r) => s + r.made, 0), rates.reduce((s, r) => s + r.of, 0)));
const value = (value: number | null): Figure => ({ value });

type Spec = { field: string; unit: Unit; better: Metric['better']; target: [number, number] | null; source: Source };

// Field id, unit, which way is better, and the range a 3.5–4.0 team usually reaches (an illustrative band).
export const SPECS: Record<MetricKey, Spec> = {
  serve_in: { field: 'ST-01', unit: 'pct', better: 'higher', target: [0.9, 0.98], source: 'measured' },
  serve_deep: { field: 'ST-02', unit: 'pct', better: 'higher', target: [0.3, 0.5], source: 'measured' },
  serve_points_won: { field: 'ST-04', unit: 'pct', better: 'higher', target: [0.4, 0.55], source: 'measured' },
  aces: { field: 'ST-05', unit: 'count', better: 'higher', target: null, source: 'measured' },
  return_in: { field: 'ST-06', unit: 'pct', better: 'higher', target: [0.9, 0.98], source: 'measured' },
  return_deep: { field: 'ST-07', unit: 'pct', better: 'higher', target: [0.3, 0.5], source: 'measured' },
  side_out: { field: 'ST-08', unit: 'pct', better: 'higher', target: [0.45, 0.6], source: 'measured' },
  third_drop: { field: 'ST-10', unit: 'pct', better: 'higher', target: [0.5, 0.7], source: 'measured' },
  first_to_kitchen: { field: 'ST-11', unit: 'pct', better: 'higher', target: [0.4, 0.6], source: 'demo' },
  kitchen_arrival: { field: 'ST-12', unit: 'sec', better: 'lower', target: null, source: 'measured' },
  transition_losses: { field: 'ST-13', unit: 'pct', better: 'lower', target: [0.2, 0.35], source: 'measured' },
  reset: { field: 'ST-20', unit: 'pct', better: 'higher', target: [0.35, 0.55], source: 'demo' },
  dinks_per_rally: { field: 'ST-14', unit: 'avg', better: 'neither', target: null, source: 'measured' },
  dink_in_kitchen: { field: 'ST-15', unit: 'pct', better: 'higher', target: [0.7, 0.85], source: 'measured' },
  pop_up: { field: 'ST-16', unit: 'pct', better: 'lower', target: [0.1, 0.2], source: 'measured' },
  speedups: { field: 'ST-17', unit: 'count', better: 'neither', target: null, source: 'measured' },
  speedup_won: { field: 'ST-18', unit: 'pct', better: 'higher', target: [0.4, 0.6], source: 'measured' },
  counter: { field: 'ST-19', unit: 'pct', better: 'higher', target: [0.4, 0.6], source: 'demo' },
  winners: { field: 'ST-24', unit: 'count', better: 'higher', target: null, source: 'measured' },
  unforced: { field: 'ST-22', unit: 'count', better: 'lower', target: null, source: 'measured' },
  forced: { field: 'ST-23', unit: 'count', better: 'lower', target: null, source: 'measured' },
  lob_won: { field: 'ST-21', unit: 'pct', better: 'higher', target: [0.3, 0.5], source: 'demo' },
};

const PHASES: [Phase['id'], MetricKey[], SplitKey[]][] = [
  ['serve', ['serve_in', 'serve_deep', 'serve_points_won', 'aces'], ['serve_depth', 'serve_target']],
  ['return', ['return_in', 'return_deep', 'side_out'], ['return_depth']],
  ['third', ['third_drop', 'first_to_kitchen', 'kitchen_arrival'], ['third_mix']],
  ['transition', ['transition_losses', 'reset'], []],
  ['kitchen', ['dinks_per_rally', 'dink_in_kitchen', 'pop_up', 'speedups', 'speedup_won', 'counter'], []],
  ['finish', ['winners', 'unforced', 'forced', 'lob_won'], ['error_types', 'won_by', 'lost_by']],
];

const DEPTHS = ['deep', 'middle', 'short'] as const;

// A soft shot (dink, drop, reset) the other team then hit from more than 25 cm above the net.
export function popUps(rallies: GameRally[], hitter: (s: Shot) => boolean) {
  const pairs = rallies.flatMap((r) =>
    r.shots.flatMap((s, i) => {
      const next = r.shots[i + 1];
      return hitter(s) && isSoft(s.gesture) && next ? [next.at.height_above_net_m > 0.25] : [];
    }),
  );
  return rate(pairs.filter(Boolean).length, pairs.length);
}

// A speed-up whose team won the rally within three more shots.
export function speedupsWon(rallies: GameRally[], hitter: (s: Shot) => boolean, team: (s: Shot) => Id | null) {
  const outcomes = rallies.flatMap((r) =>
    r.shots
      .filter((s) => hitter(s) && isSpeedup(s))
      .map((s) => r.winner_team_id === team(s) && r.shot_count <= s.shot_number + 3),
  );
  return rate(outcomes.filter(Boolean).length, outcomes.length);
}

export const playersOf = (ctx: Context, team: Id) => ctx.players.filter((p) => p.team_id === team);

function measure(ctx: Context, key: MetricKey, team: Id): Figure {
  const own = playersOf(ctx, team);
  const by = (pick: (p: PlayerReport) => Rate) => sum(own.map(pick));
  const t = ctx.teams.find((x) => x.team_id === team);
  const hitter = (s: Shot) => ctx.teamOf(s.player_id) === team;
  const seed = `${ctx.id}:${key}:${team}`;
  const demoRate = (lo: number, hi: number) => {
    const of = whole(`${seed}:of`, 10, 30);
    const made = Math.round(of * between(seed, lo, hi));
    return fromRate(rate(made, of));
  };

  switch (key) {
    case 'serve_in':
      return by((p) => p.serve.in);
    case 'serve_deep':
      return by((p) => p.serve.deep);
    case 'serve_points_won':
      return fromRate(t!.serve_points_won);
    case 'aces':
      return value(t!.point_sources.find((s) => s.label === 'ace')?.value ?? 0);
    case 'return_in':
      return by((p) => p.return.in);
    case 'return_deep':
      return by((p) => p.return.deep);
    case 'side_out':
      return fromRate(t!.side_outs);
    case 'third_drop':
      return by((p) => p.third_shot.drop_in_kitchen);
    case 'first_to_kitchen':
      return demoRate(0.3, 0.62);
    case 'kitchen_arrival': {
      const d = own.map((p) => p.positioning.kitchen_arrival_sec);
      const n = d.reduce((s, x) => s + x.n, 0);
      return value(n ? d.reduce((s, x) => s + (x.avg ?? 0) * x.n, 0) / n : null);
    }
    case 'transition_losses': {
      const lost = ctx.rallies.filter((r) => r.winner_team_id && r.winner_team_id !== team);
      const last = lost.map((r) => r.shots.findLast(hitter));
      return fromRate(rate(last.filter((s) => s && band(ctx.court, s.at.y_m) === 'transition').length, lost.length));
    }
    case 'reset':
      return demoRate(0.3, 0.6);
    case 'dinks_per_rally': {
      const counts = ctx.rallies.map((r) => r.shots.filter((s) => hitter(s) && family(s.gesture) === 'dink').length).filter(Boolean);
      return value(counts.length ? counts.reduce((s, n) => s + n, 0) / counts.length : null);
    }
    case 'dink_in_kitchen':
      return by((p) => p.dinks.in_kitchen);
    case 'pop_up':
      return fromRate(popUps(ctx.rallies, hitter));
    case 'speedups':
      return value(ctx.rallies.reduce((s, r) => s + r.shots.filter((x) => hitter(x) && isSpeedup(x)).length, 0));
    case 'speedup_won':
      return fromRate(speedupsWon(ctx.rallies, hitter, (s) => ctx.teamOf(s.player_id)));
    case 'counter':
      return demoRate(0.35, 0.65);
    case 'winners':
      return value(t!.point_sources.filter((s) => s.label === 'winner' || s.label === 'attack').reduce((s, x) => s + x.value, 0));
    case 'unforced':
      return value(own.reduce((s, p) => s + p.errors.unforced, 0));
    case 'forced':
      return value(own.reduce((s, p) => s + p.errors.forced, 0));
    case 'lob_won':
      return demoRate(0.25, 0.55);
  }
}

export function metric(ctx: Context, key: MetricKey): Metric {
  const { field, unit, better, target, source } = SPECS[key];
  return { field, key, unit, better, target, source, teams: Object.fromEntries(ctx.teamIds.map((t) => [t, measure(ctx, key, t)])) };
}

function depths(ctx: Context, shot: number, team: Id): Part[] {
  const landed = ctx.rallies.flatMap((r) => {
    const s = r.shots.find((x) => x.shot_number === shot);
    return s?.bounce?.in_bounds && ctx.teamOf(s.player_id) === team ? [depthBucket(ctx.court, s.bounce.y_m)] : [];
  });
  return sharesOf(landed, DEPTHS);
}

// How a team's rallies ended: by its own winning shot, or the other team's forced or unforced error.
function endings(ctx: Context, team: Id, won: boolean): Part[] {
  const rallies = ctx.rallies.filter((r) => r.winner_team_id && (r.winner_team_id === team) === won);
  return sharesOf(
    rallies.map((r) => (r.ended_by.kind === 'error' ? (r.ended_by.cause ?? 'unforced') : 'winner')),
    ['winner', 'forced', 'unforced'],
  );
}

function part(ctx: Context, key: SplitKey, team: Id): Part[] {
  switch (key) {
    case 'serve_depth':
      return depths(ctx, 1, team);
    case 'return_depth':
      return depths(ctx, 2, team);
    case 'serve_target':
      return ['backhand', 'body', 'forehand'].map((label, i) => ({ label, value: shares(`${ctx.id}:target:${team}`, 3, 0.4)[i] }));
    case 'third_mix': {
      const third = ctx.rallies.flatMap((r) => {
        const s = r.shots.find((x) => x.shot_number === 3);
        return s && ctx.teamOf(s.player_id) === team ? [family(s.gesture)] : [];
      });
      const kinds = third.map((g) => (['drop', 'drive', 'lob'].includes(g) ? g : 'other'));
      return sharesOf(kinds, ['drop', 'drive', 'lob', 'other']);
    }
    case 'error_types': {
      const types = playersOf(ctx, team).flatMap((p) => p.errors.by_type.flatMap((x) => Array<string>(x.value).fill(x.label)));
      return sharesOf(types, ['into_net', 'out_long', 'out_wide', 'kitchen_violation', 'serve_fault', 'foot_fault', 'missed_return']).filter(
        (x) => x.value > 0,
      );
    }
    case 'won_by':
      return endings(ctx, team, true);
    case 'lost_by':
      return endings(ctx, team, false);
  }
}

const SPLIT_FIELDS: Record<SplitKey, [string, Source]> = {
  serve_depth: ['ST-02', 'measured'],
  serve_target: ['ST-03', 'demo'],
  return_depth: ['ST-07', 'measured'],
  third_mix: ['ST-09', 'measured'],
  error_types: ['ST-25', 'measured'],
  won_by: ['ST-33', 'measured'],
  lost_by: ['ST-33', 'measured'],
};

const split = (ctx: Context, key: SplitKey): Split => ({
  field: SPLIT_FIELDS[key][0],
  key,
  source: SPLIT_FIELDS[key][1],
  teams: Object.fromEntries(ctx.teamIds.map((t) => [t, part(ctx, key, t)])),
});

export const phases = (ctx: Context): Phase[] =>
  PHASES.map(([id, keys, splits]) => ({ id, metrics: keys.map((k) => metric(ctx, k)), splits: splits.map((k) => split(ctx, k)) }));
