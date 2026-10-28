import { mean, tally } from '../stats.ts';
import type { Id, Report } from './types';

export type Score = Record<Id, number>;

type RallyRow = {
  number: number;
  start: number;
  duration: number;
  shots: number;
  winnerTeam: Id | null;
  score: Score | null;
};

type PlayerSummary = {
  id: Id;
  teamId: Id;
  shots: number;
  attacks: number;
  attacksWon: number;
  errors: number;
  unforced: number;
  ballSpeed: number;
  topSpeed: number;
  reaction: number;
  moveSpeed: number;
};

export const teamIds = (report: Report) => report.match.teams.map((t) => t.team_id);

export const teamOf = (report: Report, playerId: Id) =>
  report.match.players.find((p) => p.player_id === playerId)?.team_id ?? '';

export function finalScore(report: Report): Score {
  const score = Object.fromEntries(teamIds(report).map((id) => [id, 0]));
  for (const point of report.match.points) score[point.winner_team_id] += 1;
  return score;
}

export function rallyRows(report: Report): RallyRow[] {
  const points = new Map(report.match.points.map((p) => [p.point_number, p]));
  const running = Object.fromEntries(teamIds(report).map((id) => [id, 0]));
  return report.match.rallies.map((rally) => {
    const point = rally.point_number === null ? undefined : points.get(rally.point_number);
    if (point) running[point.winner_team_id] += 1;
    return {
      number: rally.rally_number,
      start: rally.start_sec,
      duration: rally.duration_sec,
      shots: rally.shot_count,
      winnerTeam: point?.winner_team_id ?? null,
      score: point ? { ...running } : null,
    };
  });
}

export function bouncesFor(report: Report, rally: number | null, player: Id | null) {
  return report.match.ball_ground_hits.filter(
    (b) => (rally === null || b.rally_number === rally) && (player === null || b.hitter_player_id === player),
  );
}

export function playerSummaries(report: Report): PlayerSummary[] {
  return report.match.players.map(({ player_id, team_id }) => {
    const p = report.players[player_id];
    const errors = Object.values(p.errors).flat();
    const speeds = p.ball_speeds.map((b) => b.speed_mps);
    return {
      id: player_id,
      teamId: team_id,
      shots: p.hitting_gestures.length,
      attacks: p.attacks.successful.length + p.attacks.unsuccessful.length,
      attacksWon: p.attacks.successful.length,
      errors: errors.length,
      unforced: errors.filter((e) => e.cause === 'unforced').length,
      ballSpeed: mean(speeds),
      topSpeed: Math.max(...speeds),
      reaction: mean(p.reaction_times.map((r) => r.reaction_sec)),
      moveSpeed: mean(p.movement_speeds.map((m) => m.speed_mps)),
    };
  });
}

export function playerTallies(report: Report, playerId: Id) {
  const p = report.players[playerId];
  return {
    shots: tally(p.hitting_gestures.map((g) => g.gesture)),
    errors: tally(Object.entries(p.errors).flatMap(([type, list]) => list.map(() => type))),
    attacks: tally([...p.attacks.successful, ...p.attacks.unsuccessful].map((a) => a.attack_type)),
  };
}
