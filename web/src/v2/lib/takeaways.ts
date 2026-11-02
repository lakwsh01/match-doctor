import { rate } from '../../lib/stats.ts';
import type { Rate } from '../../lib/stats.ts';
import type { PlayerReport } from '../../lib/report/player.ts';
import type { Id } from '../../lib/report/types';
import type { Context } from './context.ts';
import { SPECS, fromRate, popUps, speedupsWon } from './phases.ts';
import { family, ref } from './rallies.ts';
import type { GameRally, Shot } from './rallies.ts';
import { between, whole } from './seed.ts';
import type { ClipRef, DrillId, Figure, Focus, Metric, MetricKey, Partnership, Phase, PlayerPlan, PlayerV2, TeamSummary, Takeaway } from './types';

const MIN_ATTEMPTS = 8;
const TOP = 3;

// The shot each metric is about, to find a rally that shows it.
const SHOT: Partial<Record<MetricKey, string>> = {
  serve_in: 'serve',
  serve_deep: 'serve',
  serve_points_won: 'serve',
  aces: 'serve',
  return_in: 'return',
  return_deep: 'return',
  side_out: 'return',
  third_drop: 'drop',
  first_to_kitchen: 'drop',
  transition_losses: 'drop',
  reset: 'reset',
  dink_in_kitchen: 'dink',
  pop_up: 'dink',
  speedup_won: 'speedup',
  counter: 'volley',
  lob_won: 'lob',
};

const DRILL: Record<MetricKey, DrillId> = {
  serve_in: 'serve_targets',
  serve_deep: 'serve_targets',
  serve_points_won: 'serve_targets',
  aces: 'serve_targets',
  return_in: 'deep_returns',
  return_deep: 'deep_returns',
  side_out: 'deep_returns',
  third_drop: 'drop_ladder',
  first_to_kitchen: 'kitchen_race',
  kitchen_arrival: 'kitchen_race',
  transition_losses: 'reset_wall',
  reset: 'reset_wall',
  dinks_per_rally: 'dink_targets',
  dink_in_kitchen: 'dink_targets',
  pop_up: 'patience_dinks',
  speedups: 'speedup_choice',
  speedup_won: 'speedup_choice',
  counter: 'counter_blocks',
  winners: 'speedup_choice',
  unforced: 'patience_dinks',
  forced: 'counter_blocks',
  lob_won: 'reset_wall',
};

// Attempts a next match needs before the figure says anything (TR-04).
const VERIFY: Partial<Record<MetricKey, number>> = { serve_in: 20, return_in: 20, third_drop: 15, dink_in_kitchen: 40, speedup_won: 10, pop_up: 30 };

const PHASE_OF = (phases: Phase[], key: MetricKey) => phases.find((p) => p.metrics.some((m) => m.key === key))?.id;

// Roughly how much of a point one more success is worth. A missed return loses the rally outright;
// one more dink into the kitchen rarely decides it. Illustrative weights, so the gaps stay comparable.
const WORTH: Partial<Record<MetricKey, number>> = {
  serve_in: 0.5,
  serve_deep: 0.15,
  serve_points_won: 1,
  aces: 1,
  return_in: 1,
  return_deep: 0.15,
  side_out: 1,
  third_drop: 0.25,
  first_to_kitchen: 0.25,
  transition_losses: 0.5,
  reset: 0.3,
  dink_in_kitchen: 0.1,
  pop_up: 0.1,
  speedup_won: 0.5,
  counter: 0.4,
  winners: 1,
  unforced: 1,
  forced: 0.5,
  lob_won: 0.5,
};

function impact(m: Metric, us: Figure, them: Figure) {
  const worth = WORTH[m.key];
  if (!worth || m.better === 'neither' || us.value === null || them.value === null) return null;
  const sign = m.better === 'higher' ? 1 : -1;
  if (m.unit === 'pct') return (us.of ?? 0) >= MIN_ATTEMPTS ? sign * (us.value - them.value) * (us.of ?? 0) * worth : null;
  return m.unit === 'count' ? sign * (us.value - them.value) * worth : null;
}

// A rally that shows the metric: one the team won (or lost) on that kind of shot, ending on it if possible.
// Rallies already used by another takeaway are skipped, and no rally is better than an unrelated one.
function rallyFor(ctx: Context, team: Id, key: MetricKey, won: boolean, used: Set<string>): ClipRef | null {
  const shot = SHOT[key];
  const kind = (s: Shot) => !shot || family(s.gesture) === shot || s.gesture === shot;
  const ours = (s: Shot) => ctx.teamOf(s.player_id) === team;
  const free = ctx.rallies.filter((r) => r.winner_team_id && (r.winner_team_id === team) === won && !used.has(`${r.game}-${r.rally_number}`));
  const last = (r: GameRally) => r.shots[r.shots.length - 1];
  const ends = free.filter((r) => last(r) && ours(last(r)) && kind(last(r)));
  const any = shot ? free.filter((r) => r.shots.some((s) => ours(s) && kind(s))) : [];
  const pool = ends.length ? ends : any;
  if (!pool.length) return null;
  const pick = pool.reduce((a, b) => (b.shot_count > a.shot_count ? b : a));
  used.add(`${pick.game}-${pick.rally_number}`);
  return ref(pick);
}

// Every metric where the teams differ by at least one point's worth.
function takeaways(ctx: Context, phases: Phase[], team: Id): Takeaway[] {
  const them = ctx.other(team);
  return phases
    .flatMap((p) => p.metrics)
    .flatMap((m) => {
      const value = impact(m, m.teams[team], m.teams[them]);
      return value === null || Math.round(Math.abs(value)) < 1
        ? []
        : [{ field: m.field, key: m.key, unit: m.unit, us: m.teams[team], them: m.teams[them], impact: value, rally: null, source: m.source }];
    });
}

// The best (or worst) takeaways, at most one per phase of the rally.
function ranked(all: Takeaway[], phases: Phase[], sign: 1 | -1, limit: number) {
  const seen = new Set<string>();
  return all
    .filter((t) => Math.sign(t.impact) === sign)
    .sort((a, b) => sign * (b.impact - a.impact))
    .filter((t) => {
      const phase = PHASE_OF(phases, t.key) ?? t.key;
      if (seen.has(phase)) return false;
      seen.add(phase);
      return true;
    })
    .slice(0, limit);
}

function target(key: MetricKey, now: number) {
  const spec = SPECS[key];
  if (spec.unit === 'pct') {
    const cap = spec.target?.[1] ?? 0.85;
    return spec.better === 'lower' ? Math.max(spec.target?.[0] ?? 0, now - 0.1) : Math.min(cap, now + 0.15);
  }
  return spec.better === 'lower' ? Math.round(now * 0.6 * 10) / 10 : Math.round(now * 1.3);
}

// One player's own figure for a metric, where the logs can split it by player.
function playerFigure(ctx: Context, p: PlayerReport, key: MetricKey): Rate | null {
  const mine = (s: GameRally['shots'][number]) => s.player_id === p.player_id;
  switch (key) {
    case 'serve_in':
      return p.serve.in;
    case 'serve_deep':
      return p.serve.deep;
    case 'return_in':
      return p.return.in;
    case 'return_deep':
      return p.return.deep;
    case 'third_drop':
      return p.third_shot.drop_in_kitchen;
    case 'dink_in_kitchen':
      return p.dinks.in_kitchen;
    case 'pop_up':
      return popUps(ctx.rallies, mine);
    case 'speedup_won':
      return speedupsWon(ctx.rallies, mine, () => p.team_id);
    default:
      return null;
  }
}

function focus(key: MetricKey, now: Figure, them: Figure, rallies: ClipRef[]): Focus {
  const spec = SPECS[key];
  return {
    key,
    field: spec.field,
    unit: spec.unit,
    now: now.value ?? 0,
    them: them.value,
    target: target(key, now.value ?? 0),
    min_attempts: VERIFY[key] ?? Math.max(10, now.of ?? 10),
    drill: DRILL[key],
    rallies,
    source: spec.source,
  };
}

function playerPlan(ctx: Context, phases: Phase[], p: PlayerReport): PlayerPlan {
  const metrics = phases.flatMap((x) => x.metrics);
  const them = ctx.other(p.team_id);
  const rows = metrics.flatMap((m) => {
    const own = playerFigure(ctx, p, m.key);
    if (!own) return [];
    const us = fromRate(own);
    const value = impact(m, us, m.teams[them]);
    return value === null ? [] : [{ m, us, value }];
  });
  // The player's own errors on the shot a metric is about: the rallies that show the leak.
  const errors = ctx.rallies.filter((r) => r.ended_by.player_id === p.player_id && r.ended_by.kind === 'error');
  const shows = (key: MetricKey) =>
    errors
      .filter((r) => {
        const end = r.shots[r.shots.length - 1];
        return !SHOT[key] || (end && (family(end.gesture) === SHOT[key] || end.gesture === SHOT[key]));
      })
      .slice(0, 2)
      .map(ref);
  const worst = rows.filter((r) => Math.round(r.value) <= -1).sort((a, b) => a.value - b.value).slice(0, TOP);
  // Worth keeping: ahead of the other team and inside the usual range, so the praise holds up.
  const inRange = (m: Metric, v: number | null) =>
    !m.target || v === null || (m.better === 'lower' ? v <= m.target[1] : v >= m.target[0]);
  const best = rows.filter((r) => Math.round(r.value) >= 1 && inRange(r.m, r.us.value)).sort((a, b) => b.value - a.value)[0];
  return {
    player_id: p.player_id,
    focus: worst.map((r) => focus(r.m.key, r.us, r.m.teams[them], shows(r.m.key))),
    keep: best ? { key: best.m.key, value: best.us.value ?? 0, unit: best.m.unit } : null,
  };
}

export const playerPlans = (ctx: Context, phases: Phase[]) => ctx.players.map((p) => playerPlan(ctx, phases, p));

// The team's two costliest leaks that no player already trains, with a drill for the pair (TR-05).
export const teamPlans = (ctx: Context, summary: Record<Id, TeamSummary>, plans: PlayerPlan[]) =>
  Object.fromEntries(
    ctx.teamIds.map((team) => {
      const trained = new Set(plans.filter((p) => ctx.teamOf(p.player_id) === team).flatMap((p) => p.focus.map((f) => f.key)));
      const open = summary[team].leaks.filter((l) => !trained.has(l.key)).slice(0, 2);
      return [team, open.map((l) => focus(l.key, l.us, l.them, l.rally ? [l.rally] : []))];
    }),
  );

export function summaries(ctx: Context, phases: Phase[], plans: PlayerPlan[]): Record<Id, TeamSummary> {
  return Object.fromEntries(
    ctx.teamIds.map((team) => {
      const all = takeaways(ctx, phases, team);
      const used = new Set<string>();
      const withRally = (list: Takeaway[]) => list.map((t) => ({ ...t, rally: rallyFor(ctx, team, t.key, t.impact > 0, used) }));
      const strengths = withRally(ranked(all, phases, 1, 5));
      const leaks = withRally(ranked(all, phases, -1, 5));
      const won = ctx.games.filter((g) => g.result.winner_team_id === team).length * 2 > ctx.games.length;
      // Headlines rest on measured or derived figures only, never on a demo value.
      const real = (t: Takeaway) => t.source !== 'demo';
      // The gap that decided it is the largest one in the winner's favour.
      const deciding = [...strengths, ...leaks].filter((t) => real(t) && Math.sign(t.impact) === (won ? 1 : -1)).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0] ?? null;
      // The next-match focus: a player's own focus on the team's costliest leak, or else the first focus found.
      const options = plans
        .filter((p) => ctx.teamOf(p.player_id) === team)
        .flatMap((p) => p.focus.map((f) => ({ player_id: p.player_id, f })));
      const first = options.find((x) => x.f.key === leaks[0]?.key) ?? options[0];
      const highlight = ctx.rallies
        .filter((r) => r.winner_team_id === team)
        .reduce<GameRally | null>((a, b) => (!a || b.shot_count > a.shot_count ? b : a), null);
      return [
        team,
        {
          verdict: { won, strength: strengths.find(real)?.key ?? null, leak: leaks.find(real)?.key ?? null },
          strengths,
          leaks,
          deciding,
          focus: first ? { player_id: first.player_id, key: first.f.key, now: first.f.now, target: first.f.target } : null,
          // Two leaks can point at the same rally; list it once.
          must_watch: [
            ...(highlight ? [{ ...ref(highlight), kind: 'highlight' as const }] : []),
            ...leaks.slice(0, 2).flatMap((l) => (l.rally ? [{ ...l.rally, kind: 'leak' as const }] : [])),
          ].filter((c, i, list) => list.findIndex((x) => x.game === c.game && x.rally_number === c.rally_number) === i),
        },
      ];
    }),
  );
}

export function partnership(ctx: Context, team: Id, summary: TeamSummary, players: PlayerV2[]): Partnership {
  const t = ctx.teams.find((x) => x.team_id === team)!;
  const seed = `${ctx.id}:pair:${team}`;
  const middle = whole(`${seed}:middle`, 12, 30);
  const both = whole(`${seed}:both`, 1, 4);
  const neither = whole(`${seed}:neither`, 1, 4);
  const forehand = Math.round((middle - both - neither) * between(`${seed}:fh`, 0.55, 0.8));
  const stackOf = whole(`${seed}:stack`, 6, 16);
  const mates = players.filter((p) => p.team_id === team);
  return {
    team_id: team,
    middle: { forehand, other: middle - both - neither - forehand, both, neither },
    middle_lost: fromRate(rate(both + neither + whole(`${seed}:lost`, 0, 2), middle)),
    together: fromRate(t.positioning.both_at_kitchen),
    split_count: whole(`${seed}:split`, 3, 12),
    spacing_m: t.positioning.partner_spacing_m.avg,
    gap: between(`${seed}:gap`, 0.08, 0.25),
    crowd: between(`${seed}:crowd`, 0.03, 0.12),
    stacking: {
      share: between(`${seed}:share`, 0.2, 0.55),
      won: fromRate(rate(whole(`${seed}:sw`, 2, stackOf), stackOf)),
      not: fromRate(rate(whole(`${seed}:nw`, 3, 12), 18)),
      switch_errors: whole(`${seed}:switch`, 0, 3),
    },
    summary: {
      strength: summary.strengths[0]?.key ?? null,
      leak: summary.leaks[0]?.key ?? null,
      target_player: mates.reduce<PlayerV2 | null>((a, b) => (!a || (b.targeted.value ?? 0) > (a.targeted.value ?? 0) ? b : a), null)?.player_id ?? null,
    },
  };
}
