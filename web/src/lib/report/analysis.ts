import { dist, merge, rate, tally } from '../stats.ts';
import type { Dist, Rate, Tally } from '../stats.ts';
import { finalScore } from './derive.ts';
import type { Score } from './derive.ts';
import { rallyErrors, rallyFacts } from './contacts.ts';
import type { Contact, RallyFact } from './contacts.ts';
import { DEEP_M, NET_HEIGHT_M, playerReport } from './player.ts';
import type { PlayerReport } from './player.ts';
import { DISTANCE_STEP_SEC, KITCHEN_REACH_M, heatGrid, teamPositioning } from './position.ts';
import type { HeatGrid, TeamPositioning } from './position.ts';
import { qualityChecks } from './quality.ts';
import type { QualityCheck } from './quality.ts';
import type { AttackType, ErrorType, Id, Report, Serve } from './types';

const REPORT_VERSION = '2.0';

const DEFINITIONS = {
  estimates: 'Speeds, positions, and contact heights are visual estimates from the video, in meters. Times are frame-measured, in seconds.',
  server: 'From the serve record of each rally: server, first or second server, score call, and serving side.',
  rally_winner: 'From the outcome record of each rally: the winning team, and the winner or the player who made the error.',
  serve_points_won: 'Rallies served by the team that scored a point for it.',
  side_outs: 'Rallies received by the team that it won, taking the serve back.',
  deep: `A serve or return that lands within ${DEEP_M} m of the baseline.`,
  kitchen_landing: 'An in-bounds bounce in a kitchen zone. Only logged bounces count; a ball volleyed out of the air has none.',
  kitchen_line: `A position inside the player's own kitchen or up to ${KITCHEN_REACH_M} m behind it.`,
  kitchen_time: 'Share of 10 Hz position samples at the kitchen line.',
  kitchen_arrival: 'Rallies where the player reached the kitchen line, and seconds from the serve to getting there.',
  both_at_kitchen: 'Share of moments when both partners stood at the kitchen line together.',
  partner_spacing: 'Distance between partners at the same moment, in meters.',
  distance: `Distance covered, measured between position samples ${DISTANCE_STEP_SEC} s apart so tracking jitter does not add up.`,
  contact_height: `Contact height above the net top. Heights more than ${NET_HEIGHT_M} m below it are under the ground and left out.`,
  heat: 'Counts of position samples per court cell, row by row from the grid origin in court.heat.',
  line_call: 'line_call_confidence on each bounce: 0 to 1, how sure the in or out call is.',
  lanes: 'Left, middle, and right thirds of the court width, as seen in the video.',
  targeted: "Opponent shots this player answered, out of those their team answered.",
  first_attack: 'The first contact in a rally logged as an attack.',
  rally_length: 'Buckets of logged contacts per rally.',
  point_sources:
    'Scored points by how they were won. An ace is a serve the other team did not return. An attack is a point closed by a logged attack. A winner is any other winning shot. An opponent error is a point won from the other team’s error.',
};

const LENGTHS: [string, number, number][] = [
  ['1-4', 1, 4],
  ['5-8', 5, 8],
  ['9-12', 9, 12],
  ['13+', 13, Infinity],
];

type RallyEnd = {
  kind: 'error' | 'winner' | 'unknown';
  player_id: Id | null;
  error_type: ErrorType | null;
  cause: 'unforced' | 'forced' | null;
  side_out: boolean;
};
type FirstAttack = { shot_id: string; player_id: Id; team_id: Id; attack_type: AttackType; won: boolean };

export type RallyReport = {
  rally_number: number;
  point_number: number | null;
  scoring: boolean;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  shot_count: number;
  serve: Omit<Serve, 'rally_number' | 'point_number'> | null;
  serving_team_id: Id | null;
  winner_team_id: Id | null;
  score_after: Score;
  ended_by: RallyEnd;
  first_attack: FirstAttack | null;
  shots: Omit<Contact, 'rally_number' | 'team_id'>[];
  tracks: { player_id: Id; points: [number, number, number][] }[];
};

export type TeamReport = {
  team_id: Id;
  end: 'far' | 'near';
  player_ids: Id[];
  points: number;
  shots: number;
  rallies_won: Rate;
  serve_points_won: Rate;
  serve_points_by_server: { label: string; won: Rate }[];
  serve_points_by_side: { label: string; won: Rate }[];
  side_outs: Rate;
  scoring_runs: Dist;
  rally_length: { label: string; won: Rate }[];
  first_attack: { taken: Rate; won: Rate };
  errors: { total: number; unforced: number };
  point_sources: Tally;
  positioning: TeamPositioning;
};

type Court = { width_m: number; length_m: number; net_y_m: number; kitchen_depth_m: number; heat: HeatGrid };

type Totals = { teams: TeamReport[]; players: PlayerReport[] };

export type GameReport = Totals & {
  report_version: string;
  kind: 'game';
  id: string;
  title: string;
  source: { file: string; schema_version: string; note: string; fps: number; track_hz: number; contact_sampling: string };
  definitions: typeof DEFINITIONS;
  court: Court;
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
  court: Court;
  result: { winner_team_id: Id; games_won: Score; points: Score };
  games: ({ id: string } & GameReport['result'])[];
  data_quality: (QualityCheck & { games: string[] })[];
};

// "Men's Doubles Gold — Game 2" -> "Men's Doubles Gold". The game is named from the report id, in the reader's language.
const eventTitle = (title: string) => title.replace(/\s+—\s+Game \d+$/, '');

const leader = (score: Score) => Object.keys(score).reduce((a, b) => (score[b] > score[a] ? b : a));

function firstAttack(f: RallyFact): FirstAttack | null {
  const c = f.contacts.find((x) => x.attack);
  return c?.attack ? { shot_id: c.shot_id, player_id: c.player_id, team_id: c.team_id, attack_type: c.attack.type, won: c.attack.won } : null;
}

// One scored point, named by how it was won. A side-out is not a point.
function pointSource(f: RallyFact): string | null {
  const point = f.point;
  if (!point) return null;
  const end = endOf(f);
  const last = f.contacts.at(-1);
  const serverScored = f.servingTeam === point.winner_team_id;
  const returnMissed =
    end.error_type === 'missed_return' || (end.kind === 'error' && (f.contacts.length <= 1 || last?.shot_number === 2));
  if (serverScored && (returnMissed || (end.kind === 'winner' && f.contacts.length <= 1))) return 'ace';
  if (end.kind === 'error') return 'opponent_error';
  if (last?.attack?.won && last.team_id === point.winner_team_id) return 'attack';
  if (end.kind === 'winner') return 'winner';
  return 'unknown';
}

function endOf(f: RallyFact): RallyEnd {
  const o = f.outcome;
  const side_out = Boolean(o?.side_out);
  if (o?.outcome === 'error') {
    return { kind: 'error', player_id: o.error_player_id ?? null, error_type: o.error_type ?? null, cause: o.cause ?? null, side_out };
  }
  const player_id = o?.winner_player_id ?? f.point?.winner_player_id ?? null;
  return { kind: player_id ? 'winner' : 'unknown', player_id, error_type: null, cause: null, side_out };
}

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;

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
  const servedBy = (key: (s: Serve) => string) =>
    [...new Set(served.flatMap((f) => (f.serve ? [key(f.serve)] : [])))].sort().map((label) => {
      const group = served.filter((f) => f.serve && key(f.serve) === label);
      return { label, won: rate(group.filter((f) => f.point && won(f)).length, group.length) };
    });

  return {
    team_id: id,
    end: team.end,
    player_ids: team.player_ids,
    points: raw.match.points.filter((p) => p.winner_team_id === id).length,
    shots: facts.reduce((sum, f) => sum + f.contacts.filter((c) => c.team_id === id).length, 0),
    rallies_won: rate(decided.filter(won).length, decided.length),
    serve_points_won: rate(served.filter((f) => f.point && won(f)).length, served.length),
    serve_points_by_server: servedBy((s) => String(s.server_number)),
    serve_points_by_side: servedBy((s) => s.serving_side),
    side_outs: rate(received.filter(won).length, received.length),
    scoring_runs: dist(scoringRuns(raw, id)),
    rally_length: LENGTHS.map(([label, lo, hi]) => {
      const group = decided.filter((f) => f.rally.shot_count >= lo && f.rally.shot_count <= hi);
      return { label, won: rate(group.filter(won).length, group.length) };
    }),
    first_attack: { taken: rate(first.length, attacked.length), won: rate(first.filter(won).length, first.length) },
    errors: { total: errors.length, unforced: errors.filter((e) => e.cause === 'unforced').length },
    point_sources: tally(
      facts.flatMap((f) => {
        const source = pointSource(f);
        return source && f.point?.winner_team_id === id ? [source] : [];
      }),
    ),
    positioning: teamPositioning(facts, team.player_ids, raw.conventions.court, team.end),
  };
}

function rallyReport(f: RallyFact): RallyReport {
  return {
    ...f.rally,
    serve: f.serve && {
      server_player_id: f.serve.server_player_id,
      server_number: f.serve.server_number,
      score_call: f.serve.score_call,
      serving_side: f.serve.serving_side,
      time_sec: f.serve.time_sec,
    },
    serving_team_id: f.servingTeam,
    winner_team_id: f.winnerTeam,
    score_after: f.score,
    ended_by: endOf(f),
    first_attack: firstAttack(f),
    shots: f.contacts.map(({ rally_number: _, team_id: __, ...shot }) => shot),
    tracks: f.tracks.map((t) => ({
      player_id: t.player_id,
      points: t.samples.map((s) => [round(s.time_sec, 1), round(s.x_m, 2), round(s.y_m, 2)]),
    })),
  };
}

export function buildGameReport(id: string, file: string, raw: Report): GameReport {
  const facts = rallyFacts(raw);
  const score = finalScore(raw);
  const rallies = raw.match.rallies;
  const longest = rallies.reduce((a, b) => (b.shot_count > a.shot_count ? b : a));
  const court = raw.conventions.court;
  const { width_m, length_m, net_y_m, kitchen_depth_m } = court;

  return {
    report_version: REPORT_VERSION,
    kind: 'game',
    id,
    title: eventTitle(raw.match.title),
    source: {
      file,
      schema_version: raw.schema_version,
      note: raw.sample_note,
      fps: raw.analysis.source_fps,
      track_hz: raw.analysis.track_hz,
      contact_sampling: raw.analysis.contact_sampling,
    },
    definitions: DEFINITIONS,
    court: { width_m, length_m, net_y_m, kitchen_depth_m, heat: heatGrid(court) },
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
    title: games[0].title,
    source: { files: games.map((g) => g.source.file) },
    definitions: DEFINITIONS,
    court: games[0].court,
    result: {
      winner_team_id: leader(gamesWon),
      games_won: gamesWon,
      points: Object.fromEntries(teams.map((t) => [t, games.reduce((sum, g) => sum + g.result.score[t], 0)])),
    },
    games: games.map((g) => ({ id: g.id, ...g.result })),
    teams: byId(games.map((g) => g.teams), (t) => t.team_id),
    players: byId(games.map((g) => g.players), (p) => p.player_id),
    data_quality: games[0].data_quality.map((first) => {
      const same = games.flatMap((g) => g.data_quality.filter((q) => q.id === first.id).map((q) => ({ ...q, game: g.id })));
      const hits = same.reduce((sum, q) => sum + q.count, 0);
      return {
        ...first,
        status: hits ? 'warning' : 'ok',
        count: hits,
        of: same.reduce((sum, q) => sum + q.of, 0),
        games: same.filter((q) => q.count).map((q) => q.game),
      };
    }),
  };
}
