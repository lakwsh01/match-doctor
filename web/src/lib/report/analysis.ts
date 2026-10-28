import { dist, merge, rate } from '../stats.ts';
import type { Dist, Rate } from '../stats.ts';
import { gameLabel } from '../format.ts';
import { finalScore } from './derive.ts';
import type { Score } from './derive.ts';
import { rallyErrors, rallyFacts } from './contacts.ts';
import type { Contact, RallyFact } from './contacts.ts';
import { DEEP_M, KITCHEN_REACH_M, playerReport } from './player.ts';
import type { PlayerReport } from './player.ts';
import { qualityChecks } from './quality.ts';
import type { QualityCheck } from './quality.ts';
import type { AttackType, Id, Report } from './types';

export const REPORT_VERSION = '1.0';

const DEFINITIONS = {
  estimates: 'Speeds, positions, and reaction times are visual estimates from the video, in meters and seconds.',
  server: 'The player who hit shot 1 of the rally, when that contact is logged as a serve.',
  rally_winner: 'Scored rallies go to the point winner. Rallies with no point go to the receiving team (side-out scoring).',
  serve_points_won: 'Rallies served by the team that scored a point for it.',
  side_outs: 'Rallies received by the team that it won, taking the serve back.',
  deep: `A serve or return that lands within ${DEEP_M} m of the baseline.`,
  kitchen_landing: 'An in-bounds bounce in a kitchen zone. Only logged bounces count; a ball volleyed out of the air has none.',
  kitchen_arrival: `Rallies where one of the player's moves ends at their own kitchen line (up to ${KITCHEN_REACH_M} m behind it), out of rallies they appear in.`,
  lanes: 'Left, middle, and right thirds of the court width, as seen in the video.',
  targeted: "Opponent shots this player answered, out of those their team answered.",
  first_attack: 'The first contact in a rally logged as an attack.',
  rally_length: 'Buckets of logged shots. Long dink exchanges were sampled, so counts are a lower bound.',
};

const LENGTHS: [string, number, number][] = [
  ['1-4', 1, 4],
  ['5-8', 5, 8],
  ['9-12', 9, 12],
  ['13+', 13, Infinity],
];

type RallyEnd = { kind: 'error' | 'winner' | 'unknown'; player_id: Id | null; detail: string | null; cause: string | null };
type FirstAttack = { shot_id: string; player_id: Id; team_id: Id; attack_type: AttackType; won: boolean };

export type RallyReport = {
  rally_number: number;
  point_number: number | null;
  scoring: boolean;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  shot_count: number;
  server_player_id: Id | null;
  serving_team_id: Id | null;
  winner_team_id: Id | null;
  score_after: Score;
  ended_by: RallyEnd;
  first_attack: FirstAttack | null;
  shots: Omit<Contact, 'rally_number' | 'team_id'>[];
  moves: RallyFact['moves'];
};

export type TeamReport = {
  team_id: Id;
  end: 'far' | 'near';
  player_ids: Id[];
  points: number;
  shots: number;
  rallies_won: Rate;
  serve_points_won: Rate;
  side_outs: Rate;
  scoring_runs: Dist;
  rally_length: { label: string; won: Rate }[];
  first_attack: { taken: Rate; won: Rate };
  errors: { total: number; unforced: number };
};

type Totals = { teams: TeamReport[]; players: PlayerReport[] };

export type GameReport = Totals & {
  report_version: string;
  kind: 'game';
  id: string;
  label: string;
  title: string;
  source: { file: string; schema_version: string; note: string };
  definitions: typeof DEFINITIONS;
  court: { width_m: number; length_m: number; net_y_m: number; kitchen_depth_m: number };
  result: {
    winner_team_id: Id;
    score: Score;
    start_sec: number;
    end_sec: number;
    play_sec: number;
    rallies: number;
    scoring_rallies: number;
    longest_rally: { rally_number: number; shot_count: number };
  };
  score_progression: { point_number: number; rally_number: number; time_sec: number; winner_team_id: Id; winner_player_id: Id; score: Score }[];
  rallies: RallyReport[];
  data_quality: QualityCheck[];
};

export type MatchReport = Totals & {
  report_version: string;
  kind: 'match';
  id: string;
  title: string;
  source: { files: string[] };
  definitions: typeof DEFINITIONS;
  result: { winner_team_id: Id; games_won: Score; points: Score };
  games: ({ id: string; label: string } & GameReport['result'])[];
  data_quality: (QualityCheck & { game_id: string })[];
};

const leader = (score: Score) => Object.keys(score).reduce((a, b) => (score[b] > score[a] ? b : a));

function firstAttack(f: RallyFact): FirstAttack | null {
  const c = f.contacts.find((x) => x.attack);
  return c?.attack ? { shot_id: c.shot_id, player_id: c.player_id, team_id: c.team_id, attack_type: c.attack.type, won: c.attack.won } : null;
}

function endOf(f: RallyFact): RallyEnd {
  const error = rallyErrors(f).at(-1);
  if (error) return { kind: 'error', player_id: error.player_id, detail: error.type, cause: error.cause };
  const winner = f.contacts.findLast((c) => c.attack?.won);
  if (winner?.attack) return { kind: 'winner', player_id: winner.player_id, detail: winner.attack.type, cause: null };
  if (f.point) return { kind: 'winner', player_id: f.point.winner_player_id, detail: null, cause: null };
  return { kind: 'unknown', player_id: null, detail: null, cause: null };
}

// Lengths of each unbroken streak of points won by the team.
function scoringRuns(raw: Report, teamId: Id): number[] {
  const streaks = raw.match.points.map((p) => (p.winner_team_id === teamId ? '1' : '0')).join('');
  return streaks.split('0').filter(Boolean).map((run) => run.length);
}

function teamReport(raw: Report, facts: RallyFact[], team: Report['match']['teams'][number]): TeamReport {
  const id = team.team_id;
  const won = (f: RallyFact) => f.winnerTeam === id;
  const decided = facts.filter((f) => f.winnerTeam);
  const served = facts.filter((f) => f.servingTeam === id);
  const received = facts.filter((f) => f.servingTeam && f.servingTeam !== id);
  const attacked = facts.filter((f) => firstAttack(f));
  const first = attacked.filter((f) => firstAttack(f)?.team_id === id);
  const errors = facts.flatMap((f) => rallyErrors(f).filter((e) => e.team_id === id));

  return {
    team_id: id,
    end: team.end,
    player_ids: team.player_ids,
    points: raw.match.points.filter((p) => p.winner_team_id === id).length,
    shots: facts.reduce((sum, f) => sum + f.contacts.filter((c) => c.team_id === id).length, 0),
    rallies_won: rate(decided.filter(won).length, decided.length),
    serve_points_won: rate(served.filter((f) => f.point && won(f)).length, served.length),
    side_outs: rate(received.filter(won).length, received.length),
    scoring_runs: dist(scoringRuns(raw, id)),
    rally_length: LENGTHS.map(([label, lo, hi]) => {
      const group = decided.filter((f) => f.rally.shot_count >= lo && f.rally.shot_count <= hi);
      return { label, won: rate(group.filter(won).length, group.length) };
    }),
    first_attack: { taken: rate(first.length, attacked.length), won: rate(first.filter(won).length, first.length) },
    errors: { total: errors.length, unforced: errors.filter((e) => e.cause === 'unforced').length },
  };
}

function rallyReport(f: RallyFact): RallyReport {
  return {
    ...f.rally,
    server_player_id: f.server,
    serving_team_id: f.servingTeam,
    winner_team_id: f.winnerTeam,
    score_after: f.score,
    ended_by: endOf(f),
    first_attack: firstAttack(f),
    shots: f.contacts.map(({ rally_number: _, team_id: __, ...shot }) => shot),
    moves: f.moves,
  };
}

export function buildGameReport(id: string, file: string, raw: Report): GameReport {
  const facts = rallyFacts(raw);
  const score = finalScore(raw);
  const rallies = raw.match.rallies;
  const longest = rallies.reduce((a, b) => (b.shot_count > a.shot_count ? b : a));
  const { width_m, length_m, net_y_m, kitchen_depth_m } = raw.conventions.court;

  return {
    report_version: REPORT_VERSION,
    kind: 'game',
    id,
    label: gameLabel(id),
    title: raw.match.title,
    source: { file, schema_version: raw.schema_version, note: raw.sample_note },
    definitions: DEFINITIONS,
    court: { width_m, length_m, net_y_m, kitchen_depth_m },
    result: {
      winner_team_id: leader(score),
      score,
      start_sec: rallies[0].start_sec,
      end_sec: rallies[rallies.length - 1].end_sec,
      play_sec: rallies.reduce((sum, r) => sum + r.duration_sec, 0),
      rallies: rallies.length,
      scoring_rallies: rallies.filter((r) => r.scoring).length,
      longest_rally: { rally_number: longest.rally_number, shot_count: longest.shot_count },
    },
    teams: raw.match.teams.map((t) => teamReport(raw, facts, t)),
    players: raw.match.players.map((p) => playerReport(raw, facts, p.player_id)),
    score_progression: facts.flatMap((f) =>
      f.point
        ? [{ point_number: f.point.point_number, rally_number: f.rally.rally_number, time_sec: f.rally.end_sec, winner_team_id: f.point.winner_team_id, winner_player_id: f.point.winner_player_id, score: f.score }]
        : [],
    ),
    rallies: facts.map(rallyReport),
    data_quality: qualityChecks(raw, facts),
  };
}

// Match totals merge the game reports, so every rate and average is re-weighted by its sample.
export function buildMatchReport(id: string, games: GameReport[]): MatchReport {
  const byId = <T>(rows: T[][], key: (row: T) => string) =>
    rows.reduce((acc, next) => acc.map((row) => merge(row, next.find((n) => key(n) === key(row)) ?? row)));
  const teams = games[0].teams.map((t) => t.team_id);
  const gamesWon = Object.fromEntries(teams.map((t) => [t, games.filter((g) => g.result.winner_team_id === t).length]));

  return {
    report_version: REPORT_VERSION,
    kind: 'match',
    id,
    title: games[0].title.replace(/\s+—\s+Game \d+$/, ''),
    source: { files: games.map((g) => g.source.file) },
    definitions: DEFINITIONS,
    result: {
      winner_team_id: leader(gamesWon),
      games_won: gamesWon,
      points: Object.fromEntries(teams.map((t) => [t, games.reduce((sum, g) => sum + g.result.score[t], 0)])),
    },
    games: games.map((g) => ({ id: g.id, label: g.label, ...g.result })),
    teams: byId(games.map((g) => g.teams), (t) => t.team_id),
    players: byId(games.map((g) => g.players), (p) => p.player_id),
    data_quality: games.flatMap((g) => g.data_quality.map((q) => ({ ...q, game_id: g.id }))),
  };
}
