import { rate } from '../../lib/stats.ts';
import type { Id } from '../../lib/report/types';
import type { Context } from './context.ts';
import { fromRate } from './phases.ts';
import { family, ref } from './rallies.ts';
import type { GameRally } from './rallies.ts';
import type { Clip, ClipTag, Momentum, ReportV2, Score, Streak, WormPoint } from './types';

const RUN = 3;
const GAME_TO = 11;
const HIGHLIGHTS = 5;

const byGame = (ctx: Context) => [...new Set(ctx.rallies.map((r) => r.game))].map((g) => ctx.rallies.filter((r) => r.game === g));

function before(rallies: GameRally[], index: number, teams: Id[]): Score {
  return index > 0 ? rallies[index - 1].score_after : Object.fromEntries(teams.map((t) => [t, 0]));
}

// Unbroken stretches of rallies that pass `test` for one team, at least three long.
// A rally the test answers with null neither counts nor breaks the stretch.
function streaks(rallies: GameRally[], teams: Id[], test: (r: GameRally, team: Id) => boolean | null): Streak[] {
  return teams.flatMap((team) => {
    const found: Streak[] = [];
    let start = -1;
    let length = 0;
    const close = (end: number) => {
      if (length >= RUN) {
        found.push({ ...ref(rallies[start]), team_id: team, length, from: before(rallies, start, teams), to: rallies[end].score_after });
      }
      start = -1;
      length = 0;
    };
    let last = -1;
    rallies.forEach((r, i) => {
      const pass = test(r, team);
      if (pass === null) return;
      if (pass) {
        if (start < 0) start = i;
        length += 1;
        last = i;
      } else if (start >= 0) close(last);
    });
    if (start >= 0) close(last);
    return found;
  });
}

// A rally the serving team wins to take the game: it reaches 10 or more and leads.
const gamePoint = (r: GameRally, ctx: Context) => {
  const s = r.serving_team_id;
  if (!s) return false;
  const was = { ...r.score_after };
  if (r.scoring && r.winner_team_id === s) was[s] -= 1;
  return was[s] >= GAME_TO - 1 && was[s] > was[ctx.other(s)];
};

export function momentum(ctx: Context): Momentum {
  const games = byGame(ctx);
  const worm: WormPoint[] = ctx.rallies
    .filter((r) => r.scoring && r.winner_team_id)
    .map((r) => ({
      ...ref(r),
      diff: r.score_after[ctx.teamIds[0]] - r.score_after[ctx.teamIds[1]],
      score: r.score_after,
      team_id: r.winner_team_id as Id,
    }));
  // A run counts points; side-outs in between do not break it. A drought counts rallies lost on receive.
  const runs = games.flatMap((g) => streaks(g, ctx.teamIds, (r, team) => (r.scoring ? r.winner_team_id === team : null)));
  const droughts = games.flatMap((g) =>
    streaks(g, ctx.teamIds, (r, team) => (r.serving_team_id && r.serving_team_id !== team ? r.winner_team_id !== team : null)),
  );
  const received = (team: Id) => (r: GameRally) => r.serving_team_id !== null && r.serving_team_id !== team;
  const clutch = Object.fromEntries(
    ctx.teamIds.map((team) => {
      const points = ctx.rallies.filter((r) => gamePoint(r, ctx));
      const ours = points.filter((r) => r.serving_team_id === team);
      const theirs = points.filter(received(team));
      return [
        team,
        {
          converted: fromRate(rate(ours.filter((r) => r.winner_team_id === team).length, ours.length)),
          saved: fromRate(rate(theirs.filter((r) => r.winner_team_id === team).length, theirs.length)),
        },
      ];
    }),
  );
  const turns = games.flatMap((g) => {
    const game = g[0]?.game;
    const all = [
      ...runs.filter((s) => s.game === game).map((s) => ({ ...s, kind: 'run' as const })),
      ...droughts.filter((s) => s.game === game).map((s) => ({ ...s, kind: 'drought' as const })),
    ];
    return all.length ? [all.reduce((a, b) => (b.length > a.length ? b : a))] : [];
  });
  return { worm, runs, droughts, clutch, turns };
}

const highlightScore = (r: GameRally) =>
  r.shot_count + (r.ended_by.kind === 'winner' ? 12 : 0) + r.shots.filter((s) => s.gesture === 'reset' || family(s.gesture) === 'drop').length;

export function clips(ctx: Context): Clip[] {
  const longest = ctx.rallies.reduce((a, b) => (b.shot_count > a.shot_count ? b : a));
  const top = new Set(
    [...ctx.rallies]
      .filter((r) => r.winner_team_id)
      .sort((a, b) => highlightScore(b) - highlightScore(a))
      .slice(0, HIGHLIGHTS),
  );
  return ctx.rallies.map((r) => {
    const tags: ClipTag[] = [];
    if (top.has(r)) tags.push('highlight');
    if (r === longest) tags.push('longest');
    if (r.ended_by.kind === 'error') tags.push('error');
    if (r.shots.some((s) => s.attack?.won && ctx.teamOf(s.player_id) === r.winner_team_id)) tags.push('attack');
    if (r.shots.some((s) => s.gesture === 'erne' || s.attack?.type === 'erne')) tags.push('erne');
    if (r.shots.some((s) => s.gesture === 'around_the_post' || s.attack?.type === 'around_the_post')) tags.push('atp');
    return {
      ...ref(r),
      score_call: r.serve?.score_call ?? null,
      server_id: r.serve?.server_player_id ?? null,
      start_sec: r.start_sec,
      end_sec: r.end_sec,
      shots: r.shot_count,
      winner_team_id: r.winner_team_id,
      scoring: r.scoring,
      ended: { kind: r.ended_by.kind, player_id: r.ended_by.player_id, error_type: r.ended_by.error_type, cause: r.ended_by.cause },
      score_after: r.score_after,
      tags,
    };
  });
}

const LENGTHS: [string, number, number][] = [
  ['1-4', 1, 4],
  ['5-8', 5, 8],
  ['9-12', 9, 12],
  ['13+', 13, Infinity],
];

// Most points in a row by the team within one game.
function longestRun(m: Momentum, team: Id) {
  let best = 0;
  let run = 0;
  m.worm.forEach((p, i) => {
    run = p.team_id === team ? (i > 0 && m.worm[i - 1].game === p.game ? run : 0) + 1 : 0;
    best = Math.max(best, run);
  });
  return best;
}

export function shape(ctx: Context, m: Momentum): ReportV2['shape'] {
  const longest = ctx.rallies.reduce((a, b) => (b.shot_count > a.shot_count ? b : a));
  const dinkRun = (r: GameRally) => {
    let best = 0;
    let run = 0;
    for (const s of r.shots) {
      run = family(s.gesture) === 'dink' ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return best;
  };
  const dinkiest = ctx.rallies.reduce((a, b) => (dinkRun(b) > dinkRun(a) ? b : a));
  const decided = ctx.rallies.filter((r) => r.winner_team_id);
  return {
    avg_shots: ctx.rallies.reduce((s, r) => s + r.shot_count, 0) / ctx.rallies.length,
    longest: { ...ref(longest), shots: longest.shot_count },
    longest_run: Object.fromEntries(ctx.teamIds.map((t) => [t, longestRun(m, t)])),
    longest_dinks: { ...ref(dinkiest), dinks: dinkRun(dinkiest) },
    lengths: LENGTHS.map(([label, lo, hi]) => {
      const group = decided.filter((r) => r.shot_count >= lo && r.shot_count <= hi);
      return {
        label,
        rallies: group.length,
        won: Object.fromEntries(ctx.teamIds.map((t) => [t, fromRate(rate(group.filter((r) => r.winner_team_id === t).length, group.length))])),
      };
    }),
  };
}
