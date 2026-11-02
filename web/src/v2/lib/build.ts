import { rate } from '../../lib/stats.ts';
import type { GameReport, TeamReport } from '../../lib/report/analysis.ts';
import type { PlayerReport } from '../../lib/report/player.ts';
import { context } from './context.ts';
import { doublesCoverage } from './fields.ts';
import { clips, momentum, shape } from './momentum.ts';
import { fromRate, phases } from './phases.ts';
import { player } from './players.ts';
import { gameNumber } from './rallies.ts';
import { partnership, playerPlans, summaries, teamPlans } from './takeaways.ts';
import type { ReportV2 } from './types';

const GAME_TO = 11;
// Figures the video can only estimate (MI-07).
const ESTIMATES = ['ST-16', 'ST-28', 'IA-08', 'IA-09', 'IA-10'];

type Source = { id: string; kind: 'game' | 'match'; games: GameReport[]; teams: TeamReport[]; players: PlayerReport[]; bestOf: number };

// One v2 report from final reports: a single game, or every game of a match with the match's merged totals.
export function buildV2({ id, kind, games, teams, players, bestOf }: Source): ReportV2 {
  const ctx = context(id, games, teams, players);
  const ph = phases(ctx);
  const plans = playerPlans(ctx, ph);
  const summary = summaries(ctx, ph, plans);
  const m = momentum(ctx);
  const people = players.map((p) => player(ctx, p));
  const tracked = ctx.rallies.filter((r) => r.tracks.length && r.tracks.every((t) => t.points.length)).length;
  const scoreOf = (t: string) => games.reduce((s, g) => s + g.result.score[t], 0);
  const gamesWon = (t: string) => games.filter((g) => g.result.winner_team_id === t).length;
  const winner = [...ctx.teamIds].sort((a, b) => gamesWon(b) - gamesWon(a) || scoreOf(b) - scoreOf(a))[0];

  return {
    version: 'v2-trial',
    id,
    kind,
    number: kind === 'game' ? gameNumber(games[0].id) : null,
    title: games[0].title,
    info: {
      format: { play: 'doubles', scoring: 'side_out', to: GAME_TO, best_of: bestOf },
      event: { date: '2026-04-26', venue: 'Championship Court' },
      games: games.map((g) => ({ number: gameNumber(g.id), score: g.result.score, winner_team_id: g.result.winner_team_id })),
      winner_team_id: winner,
      duration_sec: games.reduce((s, g) => s + g.result.end_sec - g.result.start_sec, 0),
      play_sec: games.reduce((s, g) => s + g.result.play_sec, 0),
      rallies: ctx.rallies.length,
      served: Object.fromEntries(ctx.teamIds.map((t) => [t, ctx.rallies.filter((r) => r.serving_team_id === t).length])),
      tracked: fromRate(rate(tracked, ctx.rallies.length)),
      estimates: ESTIMATES,
      checks: {
        warnings: games.reduce((s, g) => s + g.data_quality.filter((q) => q.status !== 'ok').length, 0),
        of: games.reduce((s, g) => s + g.data_quality.length, 0),
      },
    },
    teams: games[0].teams.map((t) => ({ team_id: t.team_id, end: t.end, player_ids: t.player_ids })),
    summary,
    phases: ph,
    shape: shape(ctx, m),
    momentum: m,
    clips: clips(ctx),
    players: people,
    partnership: ctx.teamIds.map((t) => partnership(ctx, t, summary[t], people)),
    plan: { players: plans, teams: teamPlans(ctx, summary, plans) },
    coverage: doublesCoverage(),
  };
}
