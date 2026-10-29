import type { Id, Report } from './types';

export type Score = Record<Id, number>;

export const teamIds = (report: Report) => report.match.teams.map((t) => t.team_id);

export const teamOf = (report: Report, playerId: Id) =>
  report.match.players.find((p) => p.player_id === playerId)?.team_id ?? '';

export function finalScore(report: Report): Score {
  const score = Object.fromEntries(teamIds(report).map((id) => [id, 0]));
  for (const point of report.match.points) score[point.winner_team_id] += 1;
  return score;
}
